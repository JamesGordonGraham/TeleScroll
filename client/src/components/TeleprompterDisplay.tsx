import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Minus, 
  Plus, 
  ArrowLeftRight, 
  X,
  ZoomIn,
  ZoomOut,
  AlignJustify,
  MoveHorizontal,
  Keyboard,
  Eye,
  EyeOff,
  Video,
  VideoOff
} from 'lucide-react';
import { useTeleprompter } from '@/hooks/use-teleprompter';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { TeleprompterSettings } from '@shared/schema';

interface TeleprompterDisplayProps {
  content: string;
  onExit: () => void;
}

export function TeleprompterDisplay({ content, onExit }: TeleprompterDisplayProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();
  
  // Fetch settings
  const { data: settings, isLoading } = useQuery<TeleprompterSettings>({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<TeleprompterSettings>) => 
      apiRequest('PATCH', '/api/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  const {
    state,
    togglePlay,
    toggleFlip,
    toggleTransparent,
    startRecording,
    stopRecording,
    adjustSpeed,
    adjustTextSize,
    adjustTextWidth,
    startScrolling,
    stopScrolling,
    resetPosition,
    goToTop,
    goToBottom,
    addMarker,
    nextMarker,
    previousMarker,
  } = useTeleprompter();

  const updateSettings = (data: Partial<TeleprompterSettings>) => {
    updateSettingsMutation.mutate(data);
  };

  // Define handler functions first
  const handleSpeedDecrease = () => {
    if (settings) {
      const newSpeed = Math.max(0.1, settings.scrollSpeed - 0.1);
      updateSettings({ scrollSpeed: newSpeed });
    }
  };
  const handleSpeedIncrease = () => {
    if (settings) {
      const newSpeed = Math.min(3.0, settings.scrollSpeed + 0.1);
      updateSettings({ scrollSpeed: newSpeed });
    }
  };
  const handleTextSizeDecrease = () => {
    if (settings) {
      const newSize = Math.max(12, settings.fontSize - 2);
      updateSettings({ fontSize: newSize });
    }
  };
  const handleTextSizeIncrease = () => {
    if (settings) {
      const newSize = Math.min(200, settings.fontSize + 2);
      updateSettings({ fontSize: newSize });
    }
  };
  const handleTextWidthDecrease = () => {
    if (settings) {
      const newWidth = Math.max(40, settings.textWidth - 5);
      updateSettings({ textWidth: newWidth });
    }
  };
  const handleTextWidthIncrease = () => {
    if (settings) {
      const newWidth = Math.min(100, settings.textWidth + 5);
      updateSettings({ textWidth: newWidth });
    }
  };

  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onSpeedUp: handleSpeedIncrease,
    onSpeedDown: handleSpeedDecrease,
    onTextSizeUp: handleTextSizeIncrease,
    onTextSizeDown: handleTextSizeDecrease,
    onTextWidthUp: handleTextWidthIncrease,
    onTextWidthDown: handleTextWidthDecrease,
    onFlip: toggleFlip,
    onExit: onExit,
    onGoToTop: () => goToTop(scrollContainerRef.current),
    onGoToBottom: () => goToBottom(scrollContainerRef.current),
    onAddMarker: addMarker,
    onNextMarker: () => nextMarker(scrollContainerRef.current, content),
    onPreviousMarker: () => previousMarker(scrollContainerRef.current, content),
    onToggleRecording: state.isRecording ? stopRecording : startRecording,
  });

  useEffect(() => {
    if (state.isPlaying && settings) {
      startScrolling(scrollContainerRef.current);
    } else {
      stopScrolling();
    }
  }, [state.isPlaying, settings?.scrollSpeed, startScrolling, stopScrolling]);

  useEffect(() => {
    resetPosition();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      // Focus the teleprompter container to ensure it can receive keyboard events
      scrollContainerRef.current.focus();
    }
  }, [content, resetPosition]);

  // Camera stream effect
  useEffect(() => {
    if (state.cameraStream && videoRef.current) {
      console.log('Setting video srcObject to camera stream');
      videoRef.current.srcObject = state.cameraStream;
      videoRef.current.play().catch(e => console.error('Video play error:', e));
    } else if (!state.cameraStream && videoRef.current) {
      console.log('Clearing video srcObject');
      videoRef.current.srcObject = null;
    }
  }, [state.cameraStream]);

  // Ensure teleprompter stays focused for keyboard events
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }
    
    // Set up periodic focus maintenance during scrolling
    const focusInterval = setInterval(() => {
      if (scrollContainerRef.current && state.isPlaying) {
        scrollContainerRef.current.focus();
      }
    }, 100);
    
    return () => clearInterval(focusInterval);
  }, [state.isPlaying]);

  // Force focus when teleprompter becomes active
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);


  if (isLoading || !settings) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <>
      {/* Camera Video Layer - this is what gets recorded */}
      {state.cameraStream && (
        <div className="fixed inset-0 w-full h-full bg-transparent" style={{ zIndex: 1 }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ 
              transform: state.isFlipped ? 'scaleX(-1)' : 'none'
            }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              if (videoRef.current && state.cameraStream) {
                videoRef.current.srcObject = state.cameraStream;
              }
            }}
            onError={(e) => console.error('Video error:', e)}
          />
        </div>
      )}

      {/* Teleprompter Overlay - visible to user but NOT recorded */}
      <section 
        className={`fixed inset-0 z-50 ${state.isTransparent ? 'bg-transparent' : (state.cameraStream ? 'bg-transparent' : 'bg-black')}`} 
        data-teleprompter-active="true"
        style={{
          pointerEvents: state.isTransparent ? 'none' : 'auto',
          zIndex: state.cameraStream ? 100 : 50, // Always above camera
          mixBlendMode: state.cameraStream ? 'normal' : 'normal'
        }}
      >
        <div 
          className="h-full flex flex-col relative" 
          style={{ 
            pointerEvents: state.isTransparent ? 'none' : 'auto'
          }}
        >
        {/* Teleprompter Text Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-hidden relative"
          style={{ 
            cursor: settings.hideCursor ? 'none' : 'auto',
            pointerEvents: state.isTransparent ? 'none' : 'auto',
            backgroundColor: state.cameraStream ? 'transparent' : 'transparent'
          }}
          tabIndex={0}
          onFocus={() => {
            // Ensure the teleprompter can receive keyboard events
            if (scrollContainerRef.current) {
              scrollContainerRef.current.focus();
            }
          }}
          onClick={() => {
            // Ensure focus when clicking anywhere in the teleprompter
            if (scrollContainerRef.current) {
              scrollContainerRef.current.focus();
            }
          }}
          onMouseEnter={() => {
            // Ensure focus when mouse enters the teleprompter
            if (scrollContainerRef.current) {
              scrollContainerRef.current.focus();
            }
          }}
        >
          <div 
            className={`text-white text-center px-8 py-16 ${state.isFlipped ? 'scale-x-[-1]' : ''}`}
            style={{
              lineHeight: 1.6,
              letterSpacing: '0.02em',
            }}
          >
            <div 
              className="mx-auto leading-relaxed"
              style={{ 
                fontSize: `${settings.fontSize}px`,
                maxWidth: `${settings.textWidth}%`,
              }}
            >
              {content.split('\n').map((line, index) => (
                <p key={index} className="mb-4 relative teleprompter-content">
                  {/* Render line with violet square markers */}
                  {line.split('■').map((segment, segmentIndex) => (
                    <span key={segmentIndex}>
                      {segment}
                      {segmentIndex < line.split('■').length - 1 && (
                        <span className="inline-block w-3 h-3 bg-violet-500 rounded-sm mx-1 align-middle"></span>
                      )}
                    </span>
                  )) || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Control Panel */}
        <div 
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 control-panel rounded-3xl px-8 py-4"
          style={state.isTransparent ? { pointerEvents: 'all' } : {}}
        >
          <div className="flex items-center space-x-6">
            {/* Play/Pause */}
            <Button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full gradient-bg-primary text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              size="sm"
            >
              {state.isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            {/* Speed Controls */}
            <div className="flex items-center space-x-3 bg-white/30 rounded-2xl px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeedDecrease}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-xl"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-800 min-w-[60px] text-center bg-white/50 rounded-lg px-3 py-1">
                {settings.scrollSpeed.toFixed(1)}x
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeedIncrease}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Size Controls */}
            <div className="flex items-center space-x-3 bg-white/30 rounded-2xl px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTextSizeDecrease}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-xl"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-800 min-w-[50px] text-center bg-white/50 rounded-lg px-3 py-1">
                {settings.fontSize}px
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTextSizeIncrease}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-xl"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Width Controls */}
            <div className="flex items-center space-x-3 bg-white/30 rounded-2xl px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTextWidthDecrease}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-xl"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-800 min-w-[50px] text-center bg-white/50 rounded-lg px-2 py-1">
                {settings.textWidth}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTextWidthIncrease}
                className="text-gray-700 hover:text-gray-900 p-2 rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Flip Text */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlip}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                state.isFlipped 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-white hover:text-blue-200 hover:bg-white/20 bg-black/30'
              }`}
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Button>

            {/* Background Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTransparent}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                state.isTransparent 
                  ? 'bg-violet-500 text-white shadow-lg' 
                  : 'text-white hover:text-violet-200 hover:bg-white/20 bg-black/30'
              }`}
              title={state.isTransparent ? 'Switch to black background' : 'Switch to transparent background (OBS overlay mode)'}
            >
              {state.isTransparent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>

            {/* Recording Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={state.isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                state.isRecording 
                  ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                  : 'text-white hover:text-red-200 hover:bg-white/20 bg-black/30'
              }`}
              title={state.isRecording ? 'Stop recording' : 'Start camera recording'}
            >
              {state.isRecording ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>

            {/* Recording Status Indicator */}
            {state.isRecording && (
              <div className="text-red-400 text-sm font-semibold bg-black/50 px-3 py-1 rounded-lg">
                REC {isFFmpegLoaded ? '(MP4)' : '(WebM)'}
              </div>
            )}

            {/* Shortcuts */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="text-white hover:text-blue-200 hover:bg-white/20 bg-black/30 p-3 rounded-2xl"
            >
              <Keyboard className="h-5 w-5" />
            </Button>

            {/* Exit */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="text-white hover:text-red-300 hover:bg-red-500/20 bg-black/30 p-3 rounded-2xl ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Play/Pause:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span>Speed Up:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">+</kbd>
              </div>
              <div className="flex justify-between">
                <span>Speed Down:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">-</kbd>
              </div>
              <div className="flex justify-between">
                <span>Text Size Up:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Shift + +</kbd>
              </div>
              <div className="flex justify-between">
                <span>Text Size Down:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Shift + -</kbd>
              </div>
              <div className="flex justify-between">
                <span>Text Width Up:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + +</kbd>
              </div>
              <div className="flex justify-between">
                <span>Text Width Down:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + -</kbd>
              </div>
              <div className="flex justify-between">
                <span>Flip Text:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">F</kbd>
              </div>
              <div className="flex justify-between">
                <span>Go to Top:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Home / H</kbd>
              </div>
              <div className="flex justify-between">
                <span>Go to Bottom:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">End / B</kbd>
              </div>
              <div className="flex justify-between">
                <span>Add Marker:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">M</kbd>
              </div>
              <div className="flex justify-between">
                <span>Next Marker:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">N</kbd>
              </div>
              <div className="flex justify-between">
                <span>Previous Marker:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Exit:</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded">Esc</kbd>
              </div>
            </div>
            <Button 
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      </section>
    </>
  );
}
