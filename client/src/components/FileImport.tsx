import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, Trash2, Play } from 'lucide-react';
import { parseFile, validateFile } from '@/lib/file-parser';
import { useToast } from '@/hooks/use-toast';

interface FileImportProps {
  onStartTeleprompter: (content: string) => void;
}

export function FileImport({ onStartTeleprompter }: FileImportProps) {
  const [content, setContent] = useState('Welcome to TelePrompter Pro! This is a sample script to demonstrate the teleprompter functionality. You can edit this text or import your own file.\n\nYour teleprompter will display text in large, readable fonts with smooth scrolling. Use the keyboard controls to adjust speed, pause, and navigate through your script.\n\nThe application supports various text formatting and provides a distraction-free reading experience perfect for presentations, speeches, and video recordings.');
  const [isUploading, setIsUploading] = useState(false);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isUploading,
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
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Import Your Script</h2>
        <p className="text-lg text-gray-600">Upload a text file or start typing to begin</p>
      </div>

      {/* File Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <CloudUpload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop your file here' : 'Drag and drop your file here'}
        </h3>
        <p className="text-gray-600 mb-4">Supports .txt, .docx files up to 10MB</p>
        <Button
          variant="default"
          disabled={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
        </Button>
      </div>

      {/* Text Editor */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Script Editor</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearText}
                className="text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button onClick={handleStartTeleprompter}>
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type or paste your script here..."
            className="min-h-64 resize-none"
          />
        </CardContent>
      </Card>
    </section>
  );
}
