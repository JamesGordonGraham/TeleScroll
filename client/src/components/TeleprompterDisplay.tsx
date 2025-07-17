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
  Keyboard
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
    onGoToTop: () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        goToTop();
      }
    },
    onGoToBottom: () => goToBottom(scrollContainerRef.current),
    onAddMarker: addMarker,
    onNextMarker: () => nextMarker(scrollContainerRef.current, content),
    onPreviousMarker: () => previousMarker(scrollContainerRef.current, content),
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
    }
  }, [content, resetPosition]);


  if (isLoading || !settings) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <section className="fixed inset-0 bg-black z-50">
      <div className="h-full flex flex-col">
        {/* Teleprompter Text Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-hidden relative"
          style={{ 
            cursor: settings.hideCursor ? 'none' : 'auto'
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
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 control-panel rounded-3xl px-8 py-4">
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
  );
}
