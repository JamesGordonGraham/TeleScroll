import { useState, useRef, useCallback } from 'react';

interface GoogleVoiceInputOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;
}

export function useGoogleVoiceInput({ onResult, onError, language = 'en-US' }: GoogleVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef<string>('');
  const displayedTextRef = useRef<string>('');

  // Simulate typing effect for better UX
  const simulateTyping = useCallback((targetText: string, isFinal: boolean) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    currentTextRef.current = targetText;
    let displayedLength = displayedTextRef.current.length;
    
    // If new text is shorter, immediately replace
    if (targetText.length < displayedLength) {
      displayedTextRef.current = targetText;
      onResult(targetText, false);
      return;
    }
    
    // If text is the same or we need to add more, type it out
    typingIntervalRef.current = setInterval(() => {
      if (displayedLength < currentTextRef.current.length) {
        displayedLength += Math.min(3, currentTextRef.current.length - displayedLength); // Type 1-3 chars at a time
        displayedTextRef.current = currentTextRef.current.slice(0, displayedLength);
        onResult(displayedTextRef.current, false);
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        if (isFinal) {
          onResult(currentTextRef.current, true);
        }
      }
    }, 50); // Type characters every 50ms for smooth effect
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    currentTextRef.current = '';
    displayedTextRef.current = '';
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      onError?.('Voice input is not supported in this browser');
      return;
    }

    try {
      console.log('Starting Google Speech API voice input...');
      setIsListening(true);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Process audio chunks for real-time transcription
      const processChunks = async () => {
        if (chunksRef.current.length < 3) return; // Wait for enough audio data

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        if (audioBlob.size < 15000) return; // Skip chunks smaller than 15KB

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'chunk.webm');
          formData.append('language', language);
          formData.append('interim', 'true'); // Flag for interim results

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.transcript && result.transcript.trim()) {
              simulateTyping(result.transcript, false); // interim result with typing effect
            }
          }
        } catch (error) {
          console.error('Interim transcription error:', error);
          // Continue without showing error to user during real-time
        }

        // Keep more chunks for better context in next transcription
        chunksRef.current = chunksRef.current.slice(-4);
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing final audio...');
        
        if (chunksRef.current.length === 0) {
          console.log('No audio data recorded');
          return;
        }

        // Create final audio blob from all chunks
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Final audio blob size:', audioBlob.size, 'chunks:', chunksRef.current.length);

        // Check if we already have text from interim results - if so, use the best available
        if (currentTextRef.current && currentTextRef.current.trim()) {
          console.log('Using accumulated interim text as final result:', currentTextRef.current);
          // Clear typing animation and show final result
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          onResult(currentTextRef.current, true);
          chunksRef.current = [];
          setIsListening(false);
          return;
        }

        // If no interim text, try processing the full recording
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'final-recording.webm');
          formData.append('language', language);
          formData.append('final', 'true'); // Flag for final processing

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Transcription failed');
          }

          const result = await response.json();
          console.log('Final transcription result:', result);
          
          if (result.transcript && result.transcript.trim()) {
            // Clear typing animation and show final result
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
            onResult(result.transcript, true);
          } else {
            // If no transcript from full recording but we had interim text, fall back to last interim
            if (displayedTextRef.current && displayedTextRef.current.trim()) {
              console.log('Falling back to last interim text:', displayedTextRef.current);
              onResult(displayedTextRef.current, true);
            } else {
              onError?.('No speech detected in the recording');
            }
          }
        } catch (error) {
          console.error('Final transcription error:', error);
          // Try to salvage with interim text if available
          if (displayedTextRef.current && displayedTextRef.current.trim()) {
            console.log('Error occurred, using last interim text:', displayedTextRef.current);
            onResult(displayedTextRef.current, true);
          } else {
            onError?.(error instanceof Error ? error.message : 'Failed to transcribe audio');
          }
        }

        chunksRef.current = [];
        setIsListening(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError?.('Recording error occurred');
        setIsListening(false);
      };

      // Start recording with larger timeslices for better quality
      mediaRecorder.start(2000); // Record in 2-second chunks
      console.log('Recording started');

      // Process chunks every 3 seconds for real-time feedback
      intervalRef.current = setInterval(processChunks, 3000);

      // Stop recording after 30 seconds to allow longer speech
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('Error starting voice input:', error);
      setIsListening(false);
      onError?.(error instanceof Error ? error.message : 'Failed to start voice input');
    }
  }, [onResult, onError, language]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}