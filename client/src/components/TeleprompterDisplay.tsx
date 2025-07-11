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
  ZoomOut,
  AlignJustify,
  MoveHorizontal
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
    adjustLineHeight,
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

  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onSpeedUp: () => adjustSpeed(0.1),
    onSpeedDown: () => adjustSpeed(-0.1),
    onTextSizeUp: () => adjustTextSize(2),
    onTextSizeDown: () => adjustTextSize(-2),
    onLineHeightUp: () => adjustLineHeight(0.1),
    onLineHeightDown: () => adjustLineHeight(-0.1),
    onTextWidthUp: () => adjustTextWidth(5),
    onTextWidthDown: () => adjustTextWidth(-5),
    onFlip: toggleFlip,
    onExit: onExit,
    onSettings: onShowSettings,
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
  const handleLineHeightDecrease = () => adjustLineHeight(-0.1);
  const handleLineHeightIncrease = () => adjustLineHeight(0.1);
  const handleTextWidthDecrease = () => adjustTextWidth(-5);
  const handleTextWidthIncrease = () => adjustTextWidth(5);

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

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowSettings}
              className="text-white hover:text-blue-200 hover:bg-white/20 bg-black/30 p-3 rounded-2xl"
            >
              <Settings className="h-5 w-5" />
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
    </section>
  );
}
