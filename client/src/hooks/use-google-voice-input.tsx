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

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
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
              onResult(result.transcript, false); // interim result
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
        console.log('Recording stopped, processing audio...');
        
        if (chunksRef.current.length === 0) {
          console.log('No audio data recorded');
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Audio blob size:', audioBlob.size);

        // Send to Google Speech API
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('language', language);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Transcription failed');
          }

          const result = await response.json();
          console.log('Transcription result:', result);
          
          if (result.transcript) {
            onResult(result.transcript, true);
          } else {
            onError?.('No speech detected in the recording');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          onError?.(error instanceof Error ? error.message : 'Failed to transcribe audio');
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