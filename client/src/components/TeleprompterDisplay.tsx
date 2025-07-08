import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Minus, 
  Plus, 
  ArrowLeftRight, 
  Settings, 
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useTeleprompter } from '@/hooks/use-teleprompter';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface TeleprompterDisplayProps {
  content: string;
  onExit: () => void;
  onShowSettings: () => void;
}

export function TeleprompterDisplay({ content, onExit, onShowSettings }: TeleprompterDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    state,
    settings,
    togglePlay,
    toggleFlip,
    adjustSpeed,
    adjustTextSize,
    startScrolling,
    stopScrolling,
    resetPosition,
  } = useTeleprompter();

  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onSpeedUp: () => adjustSpeed(0.1),
    onSpeedDown: () => adjustSpeed(-0.1),
    onTextSizeUp: () => adjustTextSize(2),
    onTextSizeDown: () => adjustTextSize(-2),
    onFlip: toggleFlip,
    onExit: onExit,
    onSettings: onShowSettings,
  });

  useEffect(() => {
    if (state.isPlaying) {
      startScrolling(scrollContainerRef.current);
    } else {
      stopScrolling();
    }
  }, [state.isPlaying, startScrolling, stopScrolling]);

  useEffect(() => {
    resetPosition();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [content, resetPosition]);

  const handleSpeedDecrease = () => adjustSpeed(-0.1);
  const handleSpeedIncrease = () => adjustSpeed(0.1);
  const handleTextSizeDecrease = () => adjustTextSize(-2);
  const handleTextSizeIncrease = () => adjustTextSize(2);

  if (!settings) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <section className="fixed inset-0 bg-black z-50">
      <div className="h-full flex flex-col">
        {/* Teleprompter Text Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: settings.hideCursor ? 'none' : 'auto' }}
        >
          <div 
            className={`text-white text-center px-8 py-16 ${state.isFlipped ? 'scale-x-[-1]' : ''}`}
            style={{
              lineHeight: settings.lineHeight,
              letterSpacing: '0.02em',
            }}
          >
            <div 
              className="max-w-4xl mx-auto leading-relaxed"
              style={{ 
                fontSize: `${settings.fontSize}px`,
              }}
            >
              {content.split('\n').map((line, index) => (
                <p key={index} className="mb-4">
                  {line || '\u00A0'}
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

            {/* Flip Text */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlip}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                state.isFlipped 
                  ? 'bg-purple-500 text-white shadow-lg' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/30'
              }`}
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowSettings}
              className="text-gray-700 hover:text-gray-900 hover:bg-white/30 p-3 rounded-2xl"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Exit */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="text-gray-700 hover:text-red-500 hover:bg-red-50 p-3 rounded-2xl ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
