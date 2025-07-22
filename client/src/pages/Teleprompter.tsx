import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Play, 
  Pause, 
  Square, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Video, 
  VideoOff, 
  Minus, 
  Plus, 
  FlipHorizontal, 
  Download,
  ArrowLeft,
  Settings,
  Home,
  SkipForward,
  SkipBack,
  Keyboard
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface TeleprompterProps {
  content: string;
  onExit: () => void;
}

export default function Teleprompter({ content, onExit }: TeleprompterProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.0);
  const [fontSize, setFontSize] = useState(24);
  const [textWidth, setTextWidth] = useState(80);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout>();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollSpeedRef = useRef<number>(scrollSpeed);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const currentMarkerIndexRef = useRef<number>(currentMarkerIndex);
  const fontSizeRef = useRef<number>(fontSize);
  const isFlippedRef = useRef<boolean>(isFlipped);

  // Extract markers and clean content
  const { displayContent, navMarkers } = useMemo(() => {
    if (!content) {
      return { displayContent: '', navMarkers: [] };
    }
    const markerChar = '■';
    const markers: { position: number }[] = [];
    const parts = content.split(markerChar);
    let currentPosition = 0;
    
    parts.slice(0, -1).forEach((part) => {
      currentPosition += part.length;
      markers.push({ position: currentPosition });
    });

    const cleanContent = parts.join('');
    return { displayContent: cleanContent, navMarkers: markers };
  }, [content]);

  // Update refs when state changes
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentMarkerIndexRef.current = currentMarkerIndex;
  }, [currentMarkerIndex]);

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return; // Don't handle shortcuts when typing in inputs
      }
      
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case ' ': 
          setIsPlaying(!isPlayingRef.current); 
          break;
        case 'f': 
          toggleFullscreen(); 
          break;
        case 'm': 
          setIsFlipped(prev => !prev); 
          break;
        case 'h': 
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            setCurrentMarkerIndex(-1);
          }
          break;
        case 'b': 
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
            setCurrentMarkerIndex(navMarkers.length);
          }
          break;
        case 'n': 
          if (navMarkers.length === 0) break;
          const nextIndex = Math.min(currentMarkerIndexRef.current + 1, navMarkers.length - 1);
          setCurrentMarkerIndex(nextIndex);
          scrollToMarker(nextIndex);
          break;
        case 'p': 
          if (navMarkers.length === 0) break;
          const prevIndex = Math.max(currentMarkerIndexRef.current - 1, 0);
          setCurrentMarkerIndex(prevIndex);
          scrollToMarker(prevIndex);
          break;
        case 'escape': 
          if (document.fullscreenElement) {
            document.exitFullscreen()?.catch((error) => {
              console.error('Exit fullscreen error:', error);
            });
            setIsFullscreen(false);
          } else {
            onExit();
          }
          break;
        case '+':
        case '=': 
          setScrollSpeed(Math.min(4.0, Math.round((scrollSpeedRef.current + 0.1) * 10) / 10)); 
          break;
        case '-': 
          setScrollSpeed(Math.max(0.1, Math.round((scrollSpeedRef.current - 0.1) * 10) / 10)); 
          break;
        case 'arrowright': 
          setScrollSpeed(Math.min(4.0, Math.round((scrollSpeedRef.current + 0.1) * 10) / 10)); 
          break;
        case 'arrowleft': 
          setScrollSpeed(Math.max(0.1, Math.round((scrollSpeedRef.current - 0.1) * 10) / 10)); 
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startScrolling();
    } else {
      stopScrolling();
    }
    return () => stopScrolling();
  }, [isPlaying]);

  useEffect(() => {
    if (isFullscreen) {
      const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      };
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(controlsTimeoutRef.current);
      };
    } else {
      setShowControls(true);
    }
  }, [isFullscreen]);

  const startScrolling = () => {
    const container = containerRef.current;
    const textElement = textRef.current;
    if (!container || !textElement) return;
    
    // Stop any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    // Fine-tuned pixel-by-pixel scrolling with smaller intervals
    scrollIntervalRef.current = setInterval(() => {
      const container = containerRef.current;
      const textElement = textRef.current;
      if (!container || !textElement || !isPlayingRef.current) {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
        return;
      }
      
      // Dynamic content height adaptation
      const totalHeight = textElement.scrollHeight;
      const viewportHeight = container.clientHeight;
      const scrollableHeight = Math.max(1, totalHeight - viewportHeight);
      
      // Precise speed control - currentSpeed directly influences scrollAmount
      const currentSpeed = scrollSpeedRef.current; // Direct speed value (0.1 to 4.0)
      const baseScrollAmount = 0.5; // Very small base increment for smoothness
      const scrollAmount = baseScrollAmount * currentSpeed; // Direct multiplication
      
      // Apply pixel-by-pixel scrolling
      if (isFlippedRef.current) {
        container.scrollTop -= scrollAmount;
        if (container.scrollTop <= 0) {
          container.scrollTop = 0;
          setIsPlaying(false);
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
          }
        }
      } else {
        container.scrollTop += scrollAmount;
        if (container.scrollTop >= scrollableHeight) {
          container.scrollTop = scrollableHeight;
          setIsPlaying(false);
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
          }
        }
      }
    }, 20); // Smaller 20ms interval for ultra-smooth motion
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = undefined;
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetToDefault = () => {
    setScrollSpeed(1.0);
    setFontSize(24);
    setTextWidth(80);
    toast({
      title: "Settings Reset",
      description: "All settings reset to default values",
    });
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen()?.catch((error) => {
          console.error('Fullscreen request error:', error);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen()?.catch((error) => {
          console.error('Exit fullscreen error:', error);
        });
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const jumpToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setCurrentMarkerIndex(-1);
    }
  };

  const jumpToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setCurrentMarkerIndex(navMarkers.length);
    }
  };

  const jumpToNextMarker = () => {
    if (navMarkers.length === 0) return;
    
    const nextIndex = Math.min(currentMarkerIndex + 1, navMarkers.length - 1);
    setCurrentMarkerIndex(nextIndex);
    scrollToMarker(nextIndex);
  };

  const jumpToPrevMarker = () => {
    if (navMarkers.length === 0) return;
    
    const prevIndex = Math.max(currentMarkerIndex - 1, 0);
    setCurrentMarkerIndex(prevIndex);
    scrollToMarker(prevIndex);
  };

  const scrollToMarker = (markerIndex: number) => {
    if (!containerRef.current || !textRef.current || markerIndex < 0 || markerIndex >= navMarkers.length) {
      return;
    }

    const marker = navMarkers[markerIndex];
    const textElement = textRef.current;
    const container = containerRef.current;
    
    // Calculate approximate scroll position based on character position
    const textContent = textElement.textContent || '';
    const markerRatio = marker.position / textContent.length;
    const targetScrollTop = (textElement.scrollHeight - container.clientHeight) * markerRatio;
    
    container.scrollTop = Math.max(0, targetScrollTop);
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)}x`;
  };

  if (!content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">No Content Available</h2>
          <Button onClick={onExit} className="bg-blue-600 hover:bg-blue-700">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Main Teleprompter Display */}
      <div
        ref={containerRef}
        className={`teleprompter-container h-screen overflow-auto cursor-none ${isFlipped ? 'transform scale-x-[-1]' : ''}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth'
        }}
      >
        <div
          ref={textRef}
          className="min-h-screen flex items-center justify-center px-8 py-16"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '1.4',
            maxWidth: `${textWidth}%`,
            margin: '0 auto',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '500'
          }}
        >
          <div className="text-center whitespace-pre-wrap">
            {displayContent.split('').map((char, index) => {
              const isMarker = navMarkers.some(marker => marker.position === index);
              return (
                <span
                  key={index}
                  className={isMarker ? 'text-violet-400' : ''}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      {(!isFullscreen || showControls) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-6">
              {/* Back Button */}
              <Button
                onClick={onExit}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Back</span>
              </Button>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => jumpToPrevMarker()}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 px-2"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  onClick={jumpToTop}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 px-2"
                >
                  <span className="text-xs">Top</span>
                </Button>
              </div>

              {/* Play/Pause with white background */}
              <Button
                onClick={togglePlayPause}
                size="sm"
                className="bg-white text-black hover:bg-gray-200 px-4"
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>

              {/* Stop Button */}
              <Button
                onClick={() => {
                  setIsPlaying(false);
                  if (containerRef.current) {
                    containerRef.current.scrollTop = 0;
                  }
                }}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <Square className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Stop</span>
              </Button>

              {/* Speed Control */}
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-medium">Speed {scrollSpeed.toFixed(1)}</span>
                <div className="w-24">
                  <Slider
                    value={[scrollSpeed]}
                    onValueChange={(value) => setScrollSpeed(value[0])}
                    min={0.1}
                    max={4.0}
                    step={0.1}
                    className="slider-white"
                  />
                </div>
              </div>

              {/* Font Size Control */}
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-medium">Size {fontSize}</span>
                <div className="w-24">
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={12}
                    max={72}
                    step={2}
                    className="slider-white"
                  />
                </div>
              </div>

              {/* Text Width Control */}
              <div className="flex items-center gap-3">
                <FlipHorizontal className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">Width {textWidth}</span>
                <div className="w-24">
                  <Slider
                    value={[textWidth]}
                    onValueChange={(value) => setTextWidth(value[0])}
                    min={40}
                    max={100}
                    step={5}
                    className="slider-white"
                  />
                </div>
              </div>

              {/* Mirror Text Button */}
              <Button
                onClick={toggleFlip}
                size="sm"
                variant="ghost"
                className={`text-white hover:bg-white/10 px-3 ${isFlipped ? 'bg-white/20' : ''}`}
              >
                <FlipHorizontal className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Mirror</span>
              </Button>

              {/* Record Button */}
              <Button
                onClick={() => setIsRecording(!isRecording)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <Video className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Record</span>
              </Button>

              {/* Fullscreen Button */}
              <Button
                onClick={toggleFullscreen}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <Maximize className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Fullscreen</span>
              </Button>

              {/* Keyboard Shortcuts Button */}
              <Button
                onClick={() => setShowShortcuts(true)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <Keyboard className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Shortcuts</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Keyboard Shortcuts</h3>
              <Button
                onClick={() => setShowShortcuts(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-black p-1"
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-black">
              {/* Navigation Shortcuts */}
              <div>
                <h4 className="font-semibold text-blue-700 mb-3">Navigation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Go to Home:</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">H</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Go to Bottom:</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">B</kbd>
                  </div>
                  {navMarkers.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Next Marker:</span>
                        <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">N</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Previous Marker:</span>
                        <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">P</kbd>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Playback & Speed Shortcuts */}
              <div>
                <h4 className="font-semibold text-blue-700 mb-3">Playback & Speed</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Play/Pause:</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Space</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Increase Speed:</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">→</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Decrease Speed:</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">←</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Fullscreen:</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">F</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Controls */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-blue-700 mb-3">Additional Controls</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-black">
                <div className="flex justify-between">
                  <span>Flip Text:</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">M</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Exit:</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Esc</kbd>
                </div>
              </div>
            </div>

            {/* Keyboard Support Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                ⌨️ Works with both USB and Bluetooth keyboards
              </p>
            </div>

            <Button 
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}