import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [fontSize, setFontSize] = useState(24);
  const [textWidth, setTextWidth] = useState(80);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTimeRef = useRef<number>(0);
  const smoothScrollRef = useRef<number>(0);

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return; // Don't handle shortcuts when typing in inputs
      }
      
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case ' ': togglePlayPause(); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleFlip(); break;
        case 'h': jumpToTop(); break;
        case 'b': jumpToBottom(); break;
        case 'n': jumpToNextMarker(); break;
        case 'p': jumpToPrevMarker(); break;
        case 'escape': 
          if (document.fullscreenElement) {
            exitFullscreen();
          } else {
            onExit();
          }
          break;
        case '+':
        case '=': setScrollSpeed(Math.min(10, scrollSpeed + 1)); break;
        case '-': setScrollSpeed(Math.max(1, scrollSpeed - 1)); break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentMarkerIndex, navMarkers]);

  useEffect(() => {
    if (isPlaying) {
      startScrolling();
    } else {
      stopScrolling();
    }
    return () => stopScrolling();
  }, [isPlaying, scrollSpeed, isFlipped]);

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
    if (!container || !isPlaying) return;
    
    lastTimeRef.current = performance.now();
    
    const scroll = (currentTime: number) => {
      if (!containerRef.current || !isPlaying) return;
      
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 100); // Cap at 100ms
      lastTimeRef.current = currentTime;
      
      // Ultra-smooth scrolling with refined speed curve
      const baseSpeed = 20; // Much slower base speed - 20 pixels per second at speed level 1
      const speedCurve = Math.pow(scrollSpeed, 1.8); // Exponential curve for better control
      const targetScrollAmount = (baseSpeed * speedCurve * deltaTime) / 1000;
      
      // Enhanced multi-layer smoothing for ultra-smooth animation
      const smoothingFactors = [0.15, 0.12, 0.10, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015, 0.01];
      let currentAmount = targetScrollAmount;
      
      // Apply progressive smoothing layers
      smoothingFactors.forEach((factor, index) => {
        const weight = 1 - (index * 0.08); // Decreasing weight for each layer
        smoothScrollRef.current += (currentAmount - smoothScrollRef.current) * factor * weight;
        currentAmount = smoothScrollRef.current;
      });
      
      // Apply final smoothed scroll amount with sub-pixel precision
      const finalScrollAmount = Math.max(0.1, smoothScrollRef.current);
      
      if (isFlipped) {
        container.scrollTop -= finalScrollAmount;
        if (container.scrollTop <= 0) {
          setIsPlaying(false);
          container.scrollTop = 0;
          smoothScrollRef.current = 0; // Reset smooth scroll reference
          return;
        }
      } else {
        container.scrollTop += finalScrollAmount;
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          setIsPlaying(false);
          container.scrollTop = container.scrollHeight - container.clientHeight;
          smoothScrollRef.current = 0; // Reset smooth scroll reference
          return;
        }
      }
      
      animationRef.current = requestAnimationFrame(scroll);
    };
    
    animationRef.current = requestAnimationFrame(scroll);
  };

  const stopScrolling = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    // Reset smooth scroll reference for clean restart
    smoothScrollRef.current = 0;
    lastTimeRef.current = 0;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetToDefault = () => {
    setScrollSpeed(5);
    setFontSize(24);
    setTextWidth(80);
    toast({
      title: "Settings Reset",
      description: "All settings reset to default values",
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
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
          msOverflowStyle: 'none'
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
                <span className="text-white text-sm font-medium">Speed {scrollSpeed}</span>
                <div className="w-24">
                  <Slider
                    value={[scrollSpeed]}
                    onValueChange={(value) => setScrollSpeed(value[0])}
                    min={1}
                    max={10}
                    step={1}
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
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Play/Pause:</span>
                <span className="text-gray-400">Space</span>
              </div>
              <div className="flex justify-between">
                <span>Speed Up:</span>
                <span className="text-gray-400">+ or =</span>
              </div>
              <div className="flex justify-between">
                <span>Speed Down:</span>
                <span className="text-gray-400">-</span>
              </div>
              <div className="flex justify-between">
                <span>Fullscreen:</span>
                <span className="text-gray-400">F</span>
              </div>
              <div className="flex justify-between">
                <span>Flip Text:</span>
                <span className="text-gray-400">M</span>
              </div>
              <div className="flex justify-between">
                <span>Go to Top:</span>
                <span className="text-gray-400">H</span>
              </div>
              <div className="flex justify-between">
                <span>Go to Bottom:</span>
                <span className="text-gray-400">B</span>
              </div>
              {navMarkers.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Next Marker:</span>
                    <span className="text-gray-400">N</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous Marker:</span>
                    <span className="text-gray-400">P</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Exit:</span>
                <span className="text-gray-400">Escape</span>
              </div>
            </div>
            <Button 
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}