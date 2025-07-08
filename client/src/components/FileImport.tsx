import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, Trash2, Play, FileText, Clipboard } from 'lucide-react';
import { parseFile, validateFile } from '@/lib/file-parser';
import { useToast } from '@/hooks/use-toast';

interface FileImportProps {
  onStartTeleprompter: (content: string) => void;
}

export function FileImport({ onStartTeleprompter }: FileImportProps) {
  const [content, setContent] = useState('Welcome to TelePrompter Pro! This is a sample script to demonstrate the teleprompter functionality. You can edit this text or import your own file.\n\nYour teleprompter will display text in large, readable fonts with smooth scrolling. Use the keyboard controls to adjust speed, pause, and navigate through your script.\n\nThe application supports various text formatting and provides a distraction-free reading experience perfect for presentations, speeches, and video recordings.');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setContent(result.content);
      toast({
        title: "File uploaded successfully",
        description: `Loaded content from ${result.filename}`,
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
  }, [toast]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setContent(text);
        toast({
          title: "Text pasted successfully",
          description: "Content has been added to the script editor",
        });
      }
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Unable to access clipboard. Try pasting directly in the text editor below.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
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
    setContent('');
  };

  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
      <div className="text-center mb-12 animate-slide-up">
        <h2 className="text-4xl font-bold gradient-text mb-6">Import Your Script</h2>
        <p className="text-xl text-gray-600 font-light">Upload a file or start typing to begin your teleprompter session</p>
      </div>

      {/* Enhanced File Upload & Paste Zone */}
      <div
        {...getRootProps()}
        className={`apple-card rounded-3xl p-12 text-center mb-8 file-drop-zone transition-all duration-300 ${
          isDragActive || isDragOver ? 'drag-over scale-[1.02] border-2 border-dashed border-blue-400' : ''
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        {/* Icon Container */}
        <div className="flex justify-center space-x-4 mb-6">
          <div className="p-4 rounded-3xl bg-white/20 backdrop-blur-sm">
            <CloudUpload className="h-10 w-10 text-white" />
          </div>
          <div className="p-4 rounded-3xl bg-gray-300/30 backdrop-blur-sm">
            <FileText className="h-10 w-10 text-gray-600" />
          </div>
          <div className="p-4 rounded-3xl bg-white/20 backdrop-blur-sm">
            <Clipboard className="h-10 w-10 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          {isDragActive ? 'Drop your file here' : 'Import Your Content'}
        </h3>
        <p className="text-gray-600 mb-8 text-lg">
          Drag & drop files (.txt, .docx), paste text, or choose a file
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            disabled={isUploading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <CloudUpload className="h-5 w-5 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>
          
          <div className="text-gray-400 font-medium">or</div>
          
          <Button
            variant="outline"
            className="btn-apple rounded-2xl px-8 py-4 font-semibold text-lg border-2 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              handlePaste();
            }}
            disabled={isUploading}
          >
            <Clipboard className="h-5 w-5 mr-2" />
            Paste Text
          </Button>
        </div>
      </div>

      {/* Text Editor */}
      <Card className="apple-card rounded-3xl border-0 shadow-2xl shadow-black/5">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold gradient-text-accent">Script Editor</h3>
            <div className="flex space-x-3">
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type or paste your script here..."
            className="min-h-80 resize-none rounded-2xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 text-lg leading-relaxed bg-gray-50/50"
          />
        </CardContent>
      </Card>
    </section>
  );
}
