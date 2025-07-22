import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, FileText, Bookmark, Mic } from 'lucide-react';
import { parseFile, validateFile } from '@/lib/file-parser';
import { useToast } from '@/hooks/use-toast';

interface FileImportProps {
  content: string;
  setContent: (content: string) => void;
  onStartTeleprompter?: () => void;
  onVoiceInput?: () => void;
}

export function FileImport({ content, setContent, onStartTeleprompter, onVoiceInput }: FileImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [content, setContent, toast]);

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
          {/* Blue heading text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'rgb(5, 128, 205)' }}>Import Your Script</h2>
            <p style={{ color: 'rgb(5, 128, 205)' }}>Upload a file, cut and paste, use voice input or start typing to begin your teleprompter session</p>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-700">Script Editor</h3>
            <div className="flex space-x-3">
              {/* Web Speech API Voice Input Button */}
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onVoiceInput?.();
                }}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice Input
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
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTeleprompter?.();
                }}
                disabled={!content}
              >
                Run Teleprompter
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
              placeholder={isDragActive ? "Drop your file here..." : "Type your script here, drag and drop a file, or use the buttons above to import content"}
              className="min-h-[400px] w-full bg-white/80 backdrop-blur-sm text-lg leading-relaxed p-6 resize-none rounded-2xl border-2 border-white/50 shadow-inner"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            />
          </div>
        </CardContent>
      </div>
    </div>
  );
}