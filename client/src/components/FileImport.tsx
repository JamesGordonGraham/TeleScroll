import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, FileText, Bookmark, Mic, MicOff } from 'lucide-react';
import { parseFile, validateFile } from '@/lib/file-parser';
import { useToast } from '@/hooks/use-toast';
import { useGoogleVoiceInput } from '@/hooks/use-google-voice-input';

interface FileImportProps {
  content: string;
  setContent: (content: string) => void;
}

export function FileImport({ content, setContent }: FileImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Google Voice input functionality
  const [lastCursorPosition, setLastCursorPosition] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastInterimText, setLastInterimText] = useState('');
  const [accumulatedText, setAccumulatedText] = useState('');
  
  const { isListening, isSupported, startListening, stopListening } = useGoogleVoiceInput({
    onResult: (text, isFinal) => {
      console.log('Google Voice result received:', text, 'isFinal:', isFinal);
      
      if (text.trim()) {
        const cursorPosition = lastCursorPosition;
        
        if (isFinal) {
          // Final transcription - clean up and add final text
          let baseContent = content;
          
          // If we have accumulated text showing, replace it with the final text
          if (accumulatedText && baseContent.includes(accumulatedText)) {
            baseContent = baseContent.replace(accumulatedText, '');
          }
          
          const finalBeforeText = baseContent.slice(0, cursorPosition);
          const finalAfterText = baseContent.slice(cursorPosition);
          const finalSeparator = finalBeforeText.length > 0 && !finalBeforeText.endsWith(' ') && !finalBeforeText.endsWith('\n') ? ' ' : '';
          const newContent = finalBeforeText + finalSeparator + text + ' ' + finalAfterText;
          
          setContent(newContent);
          setAccumulatedText('');
          setLastInterimText('');
          setIsTranscribing(false);
          
          // Update cursor position for next insertion
          const newPosition = cursorPosition + finalSeparator.length + text.length + 1;
          setLastCursorPosition(newPosition);
          
          // Focus textarea and set cursor position
          const textarea = textareaRef.current;
          if (textarea) {
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(newPosition, newPosition);
            }, 100);
          }

          toast({
            title: "Voice input complete",
            description: `Added: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
          });
        } else {
          // Interim transcription - show progressive updates
          setIsTranscribing(true);
          
          let baseContent = content;
          
          // Remove previous accumulated text
          if (accumulatedText) {
            const accumulatedStart = baseContent.lastIndexOf(accumulatedText);
            if (accumulatedStart !== -1) {
              baseContent = baseContent.slice(0, accumulatedStart) + baseContent.slice(accumulatedStart + accumulatedText.length);
            }
          }
          
          // Add new interim text
          const beforeText = baseContent.slice(0, cursorPosition);
          const afterText = baseContent.slice(cursorPosition);
          const separator = beforeText.length > 0 && !beforeText.endsWith(' ') && !beforeText.endsWith('\n') ? ' ' : '';
          const newAccumulatedText = separator + text;
          const interimContent = beforeText + newAccumulatedText + afterText;
          
          setContent(interimContent);
          setAccumulatedText(newAccumulatedText);
          
          console.log('Interim transcription:', text);
        }
      }
    },
    onError: (error) => {
      console.error('Google Voice input error:', error);
      toast({
        title: "Voice input error",
        description: error,
        variant: "destructive",
      });
    },
  });

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsTranscribing(false);
      toast({
        title: "Voice recording stopped",
        description: "Processing final transcription...",
      });
    } else {
      if (!isSupported) {
        toast({
          title: "Voice input not supported",
          description: "Your browser doesn't support voice recording",
          variant: "destructive",
        });
        return;
      }
      
      // Get current cursor position before starting
      const textarea = textareaRef.current;
      if (textarea) {
        setLastCursorPosition(textarea.selectionStart);
      }
      
      // Reset states
      setLastInterimText('');
      setAccumulatedText('');
      setIsTranscribing(false);
      
      startListening();
      toast({
        title: "Voice recording started",
        description: "Speak clearly - text will appear as you speak (up to 30 seconds)!",
      });
    }
  };

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
      
      // Append to existing content instead of replacing
      const separator = content.length > 0 && !content.endsWith('\n') && !content.endsWith(' ') ? '\n\n' : '';
      const newContent = content + separator + result.content;
      setContent(newContent);
      
      toast({
        title: "File uploaded successfully",
        description: `Added content from ${result.filename} to your script`,
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
  }, [toast, setContent]);

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

  // Clear functionality is now handled by parent component

  const handleAddMarker = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const markerSymbol = '■'; // Violet square marker (will be styled with CSS)
    
    const newContent = content.slice(0, cursorPosition) + markerSymbol + content.slice(cursorPosition);
    setContent(newContent);
    
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
    <div>
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
              {/* Google Speech API Voice Input Button */}
              <Button
                className={`${
                  isListening 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } text-white px-4 py-2 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVoiceToggle();
                }}
                disabled={!isSupported}
              >
                {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isListening ? 'Stop Voice' : 'Voice Input'}
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



            </div>
          </div>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
              onFocus={() => {
                // Update cursor position when textarea is focused
                const textarea = textareaRef.current;
                if (textarea && !isListening) {
                  setLastCursorPosition(textarea.selectionStart);
                }
              }}
              onClick={() => {
                // Update cursor position when clicking in textarea
                const textarea = textareaRef.current;
                if (textarea && !isListening) {
                  setTimeout(() => {
                    setLastCursorPosition(textarea.selectionStart);
                  }, 10);
                }
              }}
              onKeyUp={() => {
                // Update cursor position when navigating with keyboard
                const textarea = textareaRef.current;
                if (textarea && !isListening) {
                  setLastCursorPosition(textarea.selectionStart);
                }
              }}
              placeholder="Type or paste your script here... (You can also drag & drop .txt, .doc, .docx, .rtf, .html, .htm, .md files)"
              className="h-[600px] resize-none rounded-2xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 text-lg leading-relaxed bg-gray-50/50"
              style={{ aspectRatio: '1/1.414' }}
            />
            {isListening && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                🎤 {isTranscribing ? 'Transcribing...' : 'Recording...'} (Real-time)
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
}
