import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, Trash2, Play, FileText, Bookmark, Mic, MicOff } from 'lucide-react';
import { parseFile, validateFile } from '@/lib/file-parser';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FileImportProps {
  onStartTeleprompter: (content: string) => void;
  content: string;
  onContentChange: (content: string) => void;
}

export function FileImport({ onStartTeleprompter, content, onContentChange }: FileImportProps) {
  // Update content ref whenever content changes
  React.useEffect(() => {
    contentRef.current = content;
  }, [content]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const contentRef = useRef<string>(content);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await parseFile(file);
      
      // Append to existing content instead of overwriting
      const existingContent = content || '';
      const needsSpace = existingContent && !existingContent.endsWith('\n') && !existingContent.endsWith(' ');
      const newContent = existingContent + (needsSpace ? '\n\n' : '') + result.content;
      
      onContentChange(newContent);
      toast({
        title: "File uploaded successfully",
        description: `Content from ${result.filename} has been added to your script`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, onContentChange]);

  // Real-time speech recording functions
  const startRealtimeRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Create WebSocket connection with ping/pong to keep alive
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/speech`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      let reconnectAttempts = 0;
      let keepAliveInterval: NodeJS.Timeout | null = null;
      
      const startKeepAlive = () => {
        keepAliveInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Send ping every 30 seconds
      };
      
      const stopKeepAlive = () => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
      };
      
      ws.onopen = () => {
        console.log('WebSocket connected for real-time speech');
        reconnectAttempts = 0;
        ws.send(JSON.stringify({ type: 'start' }));
        startKeepAlive();
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          if (data.isFinal && data.text.trim()) {
            // Use the ref to get the most current content state
            const trimmedText = data.text.trim();
            const currentContent = contentRef.current || '';
            
            // Add space before new text if content exists and doesn't end with space
            const needsSpace = currentContent && !currentContent.endsWith(' ') && !currentContent.endsWith('\n');
            const newContent = currentContent + (needsSpace ? ' ' : '') + trimmedText;
            
            // Update both the state and the ref
            contentRef.current = newContent;
            onContentChange(newContent);
            setRealtimeTranscript(''); // Clear interim text
          } else {
            // Show interim results without affecting final content
            setRealtimeTranscript(data.text);
          }
        } else if (data.type === 'error') {
          console.error('Speech recognition error:', data.message);
          // Don't show common timeout/restart errors
          if (!data.message.includes('timeout') && !data.message.includes('OUT_OF_RANGE') && !data.message.includes('limit')) {
            toast({
              title: "Recognition error",
              description: data.message,
              variant: "destructive",
            });
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        stopKeepAlive();
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        stopKeepAlive();
        
        // Auto-reconnect if still recording and haven't exceeded attempts
        if (isRecording && reconnectAttempts < 3) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/3)...`);
          
          setTimeout(() => {
            if (isRecording) {
              // Restart the entire recording process
              stopRealtimeRecording();
              setTimeout(() => startRealtimeRecording(), 1000);
            }
          }, 1000);
        } else if (reconnectAttempts >= 3) {
          toast({
            title: "Connection failed",
            description: "Voice input has stopped. Please restart manually.",
            variant: "destructive",
          });
          setIsRecording(false);
        }
      };
      
      // Setup audio processing with smaller buffer for more responsive streaming
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1); // Smaller buffer
      processorRef.current = processor;
      
      processor.onaudioprocess = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Convert float32 to int16
          const int16Array = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          
          // Send audio data as base64
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(int16Array.buffer)));
          ws.send(JSON.stringify({
            type: 'audio',
            audio: audioBase64
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsRecording(true);
      setRealtimeTranscript('');
      
      toast({
        title: "Real-time recording started",
        description: "Speak clearly - text will appear as you talk",
      });
      
    } catch (error) {
      console.error('Error starting real-time recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast, onContentChange, isRecording]);
  
  const stopRealtimeRecording = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    setRealtimeTranscript('');
    
    toast({
      title: "Recording stopped",
      description: "Speech-to-text session ended",
    });
  }, [toast]);
  
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      
      if (result.transcription && result.transcription.trim()) {
        // Append transcription to existing content
        const newContent = content 
          ? content + '\n\n' + result.transcription.trim()
          : result.transcription.trim();
        onContentChange(newContent);
        
        toast({
          title: "Speech transcribed",
          description: `Added: "${result.transcription.substring(0, 50)}${result.transcription.length > 50 ? '...' : ''}"`,
        });
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking more clearly",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Failed to convert speech to text",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [content, onContentChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/rtf': ['.rtf'],
      'text/rtf': ['.rtf'],

      'text/html': ['.html', '.htm'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    disabled: isUploading,
    noClick: true, // We'll handle clicks manually for better UX
  });

  const handleStartTeleprompter = () => {
    if (!content.trim()) {
      toast({
        title: "No content",
        description: "Please enter some text first.",
        variant: "destructive",
      });
      return;
    }
    onStartTeleprompter(content);
  };

  const handleClearText = () => {
    onContentChange('');
  };

  const handleAddMarker = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const markerSymbol = '■'; // Violet square marker (will be styled with CSS)
    
    const newContent = content.slice(0, cursorPosition) + markerSymbol + content.slice(cursorPosition);
    onContentChange(newContent);
    
    // Move cursor after the marker
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
    }, 0);

    toast({
      title: "Marker added",
      description: "Violet marker inserted at cursor position",
    });
  };

  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
      <div className="text-center mb-12 animate-slide-up">
        <h2 className="text-4xl font-bold gradient-text mb-6">Import Your Script</h2>
        <p className="text-xl text-gray-600 font-light">Upload a file, cut and paste, use voice or start typing to begin your teleprompter session</p>
      </div>

      {/* Script Editor */}
      <div
        {...getRootProps()}
        className={`apple-card rounded-3xl border-0 shadow-2xl shadow-black/5 mb-8 transition-all duration-300 ${
          isDragActive || isDragOver ? 'drag-over scale-[1.02] border-2 border-dashed border-blue-400' : ''
        }`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold gradient-text-accent">Script Editor</h3>
            <div className="flex space-x-3">
              {/* Voice Input Button */}
              <Button
                className={`${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } text-white px-4 py-2 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300`}
                disabled={isUploading || isTranscribing}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isRecording) {
                    stopRealtimeRecording();
                  } else {
                    startRealtimeRecording();
                  }
                }}
              >
                {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isTranscribing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Voice Input'}
              </Button>

              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <CloudUpload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>

              <Button
                className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white px-4 py-2 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddMarker();
                }}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Add Marker
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearText}
                className="btn-apple rounded-2xl px-4 py-2 text-gray-500 hover:text-red-500 border-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button 
                onClick={handleStartTeleprompter}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Teleprompter
              </Button>
            </div>
          </div>
          <Textarea
            ref={textareaRef}
            value={content + (realtimeTranscript ? (content && !content.endsWith(' ') && !content.endsWith('\n') ? ' ' + realtimeTranscript : realtimeTranscript) : '')}
            onChange={(e) => {
              // Only update if user is typing (not from real-time transcript)
              if (!isRecording) {
                onContentChange(e.target.value);
              }
            }}
            onPaste={(e) => {
              // Allow normal paste behavior - the textarea handles it automatically
              // But also show a success message
              setTimeout(() => {
                toast({
                  title: "Text pasted",
                  description: "Content has been pasted into the script editor",
                });
              }, 100);
            }}
            placeholder="Type or paste your script here... (You can also drag & drop .txt, .doc, .docx, .rtf, .html, .htm, .md files)"
            className="h-[600px] resize-none rounded-2xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 text-lg leading-relaxed bg-gray-50/50"
            style={{ aspectRatio: '1/1.414' }}
          />
          {isRecording && realtimeTranscript && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium text-blue-700">Live Transcription</span>
              </div>
              <p className="text-gray-600 italic">{realtimeTranscript}</p>
            </div>
          )}
        </CardContent>
      </div>
    </section>
  );
}
