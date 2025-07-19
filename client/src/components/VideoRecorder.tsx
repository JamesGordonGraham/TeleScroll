import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Video, VideoOff, Download, Crown, Camera, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

interface VideoRecorderProps {
  isVisible: boolean;
  onClose: () => void;
}

export function VideoRecorder({ isVisible, onClose }: VideoRecorderProps) {
  const { toast } = useToast();
  const { canUseFeature, needsUpgrade } = useSubscription();
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    if (!canUseFeature('video_recording')) {
      toast({
        title: "Premium Feature",
        description: "Video recording requires Premium subscription. Upgrade to access this feature!",
        variant: "destructive",
      });
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        setHasRecording(true);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Video recording is now active",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start video recording. Please check camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Your video has been recorded successfully",
      });
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teleprompter-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your recording is being downloaded",
      });
    }
  };

  const canUseVideo = canUseFeature('video_recording');
  const needsUpgradeForVideo = needsUpgrade('video_recording');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-100 to-purple-100 rounded-lg">
                <Camera className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Video Recording
                  <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-purple-100">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </CardTitle>
                <CardDescription>Record yourself with the teleprompter</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {needsUpgradeForVideo && (
            <Card className="border-red-200 bg-gradient-to-r from-red-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Premium Feature</h3>
                    <p className="text-gray-600">Upgrade to Premium to access video recording with transparent background</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Preview */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-64 rounded-lg object-cover ${
                transparentBackground ? 'bg-green-500' : 'bg-gray-900'
              }`}
              style={{
                transform: 'scaleX(-1)', // Mirror the video
              }}
            />
            {!isRecording && !streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Click start to begin recording</p>
                </div>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                Recording
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="transparent-bg"
                  checked={transparentBackground}
                  onCheckedChange={setTransparentBackground}
                  disabled={!canUseVideo}
                />
                <Label htmlFor="transparent-bg">Transparent Background</Label>
                <Badge variant="outline" className="text-xs">
                  Premium
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={!canUseVideo}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {hasRecording && (
                <Button
                  onClick={downloadRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              • The teleprompter text will not appear in your recording
            </p>
            <p>
              • Use transparent background for easy compositing in video editing software
            </p>
            <p>
              • Recording will include both video and audio
            </p>
            {transparentBackground && (
              <p className="text-green-600">
                • Green screen background enabled for easy background removal
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}