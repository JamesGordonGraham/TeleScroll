import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  onClose: () => void;
}

export default function VoiceInput({ onVoiceInput, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [shouldContinueListening, setShouldContinueListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const accumulatedTextRef = useRef<string>("");
  const lastProcessedLengthRef = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check if SpeechRecognition API is available in the browser
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Configure recognition properties for smooth real-time transcription
      recognitionRef.current.continuous = true; // Keep listening even if user pauses
      recognitionRef.current.interimResults = true; // Show results as they are being spoken
      recognitionRef.current.lang = 'en-US'; // Set language
      recognitionRef.current.maxAlternatives = 1; // Only get the best result
      
      // Event handler for when speech is recognized - clean approach to prevent duplication
      recognitionRef.current.onresult = (event: any) => {
        let fullTranscript = '';

        // Get the complete transcript from all results
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        // Only process if we have new content beyond what we've already processed
        if (fullTranscript.length > lastProcessedLengthRef.current) {
          // Extract only the new part
          const newContent = fullTranscript.slice(lastProcessedLengthRef.current).trim();
          
          if (newContent) {
            // Add new content to accumulated text
            accumulatedTextRef.current = accumulatedTextRef.current + (accumulatedTextRef.current ? ' ' : '') + newContent;
            
            // Update the display
            setTranscript(accumulatedTextRef.current);
            
            // Update the processed length
            lastProcessedLengthRef.current = fullTranscript.length;
          }
        }
      };

      // Event handler for when listening stops - auto-restart to maintain continuous listening
      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Reset processing counters on restart to prevent issues
        lastProcessedLengthRef.current = 0;
        
        // Auto-restart after a brief delay to maintain continuous listening
        setTimeout(() => {
          if (recognitionRef.current && shouldContinueListening) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log('Auto-restart failed:', error);
            }
          }
        }, 100);
      };

      // Event handler for errors
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access and try again",
            variant: "destructive",
          });
        } else if (event.error === 'network') {
          toast({
            title: "Network Error",
            description: "Please check your internet connection",
            variant: "destructive",
          });
        }
        
        setIsListening(false);
      };

      // Handle start event
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
    }

    // Cleanup function: stop recognition when component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      setShouldContinueListening(true); // Enable continuous listening
      // Initialize counters - keep existing transcript but reset processing
      accumulatedTextRef.current = transcript;
      lastProcessedLengthRef.current = 0;
      
      try {
        recognitionRef.current.start(); // Start listening
        toast({
          title: "Voice Input Started",
          description: "Start speaking - your words will appear in real-time",
        });
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast({
          title: "Voice Input Error", 
          description: "Failed to start voice recognition. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setShouldContinueListening(false); // Disable continuous listening
      recognitionRef.current.stop(); // Stop listening
      setIsListening(false);
      toast({
        title: "Voice Input Stopped",
        description: "Voice recording has been stopped",
      });
    }
  };

  const handleAddToScript = () => {
    if (transcript.trim()) {
      onVoiceInput(transcript.trim()); // Pass the recognized text to the parent component
      toast({
        title: "Text Added to Script",
        description: "Voice input has been added to your script editor",
      });
      onClose(); // Close the modal
    } else {
      toast({
        title: "No Text to Add",
        description: "Please record some speech first",
        variant: "destructive",
      });
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    accumulatedTextRef.current = ""; // Reset accumulated text
    lastProcessedLengthRef.current = 0; // Reset processing counter
    toast({
      title: "Transcript Cleared",
      description: "Voice input text has been cleared - ready for new input",
    });
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md mx-auto bg-white shadow-xl">
          {/* Blue Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MicOff className="h-5 w-5 text-white mr-2" />
                <h3 className="text-lg font-semibold text-white">Voice Input</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-300 rounded-full flex items-center justify-center mb-4">
              <MicOff className="h-8 w-8 text-gray-600" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Voice Input Not Supported</h4>
            <p className="text-gray-600 mb-4">
              Your browser doesn't support voice input. Please use Chrome, Edge, or Safari.
            </p>
            <Button onClick={onClose} className="bg-blue-500 hover:bg-blue-600">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto bg-white shadow-xl">
        {/* Blue Header like in the screenshot */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Mic className="h-5 w-5 text-white mr-2" />
              <h3 className="text-lg font-semibold text-white">Voice Input</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

      <CardContent className="p-6">
        {!isListening && !transcript ? (
          // Initial state - show big blue microphone button like in screenshot
          <div className="text-center py-8">
            <div className="mb-6">
              <button 
                onClick={startListening}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105"
              >
                <Mic className="h-8 w-8 text-white" />
              </button>
            </div>
            <h4 className="text-lg font-semibold mb-2">Ready to listen</h4>
            <p className="text-gray-600 mb-6">Click the microphone to start voice input</p>
          </div>
        ) : (
          // Recording/transcript state
          <div>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                isListening 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                {isListening ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
              </div>
              <p className="mt-3 text-sm font-medium">
                {isListening ? (
                  <span className="text-red-600">🔴 Listening</span>
                ) : (
                  <span className="text-gray-600">Ready</span>
                )}
              </p>
              <div className="mt-3 space-x-2">
                {isListening ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopListening}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Stop Listening
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={startListening}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Start Voice Input
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Real-time Transcript:</h4>
              <div className="min-h-[100px] p-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm">
                {transcript || (isListening ? 'Listening... speak clearly' : 'Click "Start Voice Input" and begin speaking')}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                • Speak clearly and at a normal pace for best results<br/>
                • Your words will appear in real-time as you speak<br/>
                • The system will continue listening until you click "Stop"<br/>
                • Click "Add to Script Editor" to insert the text into your teleprompter
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearTranscript}
                disabled={!transcript}
                size="sm"
              >
                Clear Text
              </Button>
              <Button
                onClick={handleAddToScript}
                disabled={!transcript.trim()}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                Add to Script Editor
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}