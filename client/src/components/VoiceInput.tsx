import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, X, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  onClose: () => void;
}

export default function VoiceInput({ onVoiceInput, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
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
      
      // Event handler for when speech is recognized - provides real-time updates
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results from the last processed index
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript; // Finalized speech
          } else {
            interimTranscript += result[0].transcript; // Interim (still being spoken) speech
          }
        }

        // Update transcript with smooth real-time display
        setTranscript(prev => {
          // Keep existing final text and add new final + interim text
          const existingFinal = prev.split(' ').filter(word => word.trim()).join(' ');
          const newFinal = finalTranscript.trim();
          const newInterim = interimTranscript.trim();
          
          if (newFinal) {
            return existingFinal + (existingFinal ? ' ' : '') + newFinal + (newInterim ? ' ' + newInterim : '');
          } else {
            return existingFinal + (existingFinal && newInterim ? ' ' : '') + newInterim;
          }
        });
      };

      // Event handler for when listening stops
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (isListening) {
          // Auto-restart if we were supposed to be listening (prevents cutoffs)
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (error) {
                console.log('Recognition restart failed:', error);
              }
            }
          }, 100);
        }
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
  }, [isListening, toast]);

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      setTranscript(""); // Clear previous transcript
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
        title: "Text Added",
        description: "Voice input has been added to your script",
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
    toast({
      title: "Transcript Cleared",
      description: "Voice input text has been cleared",
    });
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MicOff className="h-5 w-5" />
              Voice Input Not Supported
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your browser doesn't support voice input. Please use a modern browser like Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Input
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Controls */}
        <div className="flex items-center justify-between">
          <Badge variant={isListening ? "default" : "secondary"} className="flex items-center gap-1">
            {isListening ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
            {isListening ? "Listening..." : "Not Listening"}
          </Badge>
          
          <div className="flex gap-2">
            {!isListening ? (
              <Button onClick={startListening} className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Start Voice Input
              </Button>
            ) : (
              <Button onClick={stopListening} variant="destructive" className="flex items-center gap-2">
                <MicOff className="h-4 w-4" />
                Stop Listening
              </Button>
            )}
          </div>
        </div>

        {/* Real-time Transcript Display */}
        <div className="min-h-[200px] p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-medium mb-2">Real-time Transcript:</h4>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {transcript || (isListening ? "Start speaking..." : "Click 'Start Voice Input' and begin speaking")}
            {isListening && <span className="animate-pulse">|</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={clearTranscript} disabled={!transcript}>
            Clear Text
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToScript} 
              disabled={!transcript.trim()}
              className="flex items-center gap-2"
            >
              Add to Script
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Speak clearly and at a normal pace for best results</p>
          <p>• Your words will appear in real-time as you speak</p>
          <p>• The system will continue listening until you click "Stop"</p>
          <p>• Click "Add to Script" to insert the text into your teleprompter</p>
        </div>
      </CardContent>
    </Card>
  );
}