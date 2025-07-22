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
  const [showSettings, setShowSettings] = useState(false);


  const textRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollSpeedRef = useRef<number>(scrollSpeed);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const currentMarkerIndexRef = useRef<number>(currentMarkerIndex);

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
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
            setCurrentMarkerIndex(-1);
          }
          break;
        case 'b': 
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    // Clear any existing interval to prevent multiple loops running simultaneously
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up the new setInterval and store its ID
    intervalRef.current = setInterval(() => {
      if (!scrollRef.current || !isPlayingRef.current) return;
      
      // scrollAmount Calculation: small, fixed number of pixels per tick
      const currentSpeed = scrollSpeedRef.current; // Speed range 0.1 to 4.0
      const scrollAmount = currentSpeed * 0.5; // Base pixel increment linking speed to pixel movement
      
      // Dynamic content height for boundary checking
      const scrollableHeight = Math.max(1, scrollRef.current.scrollHeight - scrollRef.current.clientHeight);
      
      // Update scrollTop: always scroll down regardless of flip state
      // The flip only affects visual appearance, not scroll direction
      scrollRef.current.scrollTop += scrollAmount;
      if (scrollRef.current.scrollTop >= scrollableHeight) {
        scrollRef.current.scrollTop = scrollableHeight;
        setIsPlaying(false);
      }
    }, 50); // Fixed, high frequency (every 50ms) for perceived smoothness
  };

  const stopScrolling = () => {
    // Check if intervalRef exists and clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined; // Reset to null
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
        scrollRef.current?.requestFullscreen()?.catch((error) => {
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setCurrentMarkerIndex(-1);
    }
  };

  const jumpToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    if (!scrollRef.current || !textRef.current || markerIndex < 0 || markerIndex >= navMarkers.length) {
      return;
    }

    const marker = navMarkers[markerIndex];
    const textElement = textRef.current;
    const container = scrollRef.current;
    
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
        ref={scrollRef}
        className={`teleprompter-container h-screen overflow-auto cursor-none ${isFlipped ? 'transform scale-x-[-1]' : ''}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'auto'
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
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = 0;
                  }
                }}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <Square className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Stop</span>
              </Button>



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

              {/* Settings Button */}
              <Button
                onClick={() => setShowSettings(true)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 px-3"
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl p-6 max-w-4xl mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-black">⚙️ Teleprompter Settings</h3>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="lg"
                className="text-gray-500 hover:text-black p-2 text-xl"
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Settings Controls */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-blue-700 border-b border-blue-300 pb-2 mb-4">🎛️ Display Settings</h4>
                
                {/* Speed Control */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <label className="block text-lg font-bold text-black mb-3">
                    📏 Scroll Speed: <span className="text-blue-600">{scrollSpeed.toFixed(1)}x</span>
                  </label>
                  <Slider
                    value={[scrollSpeed]}
                    onValueChange={(value) => setScrollSpeed(value[0])}
                    min={0.1}
                    max={4.0}
                    step={0.1}
                    className="w-full mb-3"
                  />
                  <div className="flex justify-between text-sm font-medium text-black">
                    <span className="bg-white px-2 py-1 rounded border">0.1x (Very Slow)</span>
                    <span className="bg-white px-2 py-1 rounded border">4.0x (Very Fast)</span>
                  </div>
                </div>

                {/* Font Size Control */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <label className="block text-lg font-bold text-black mb-3">
                    🔤 Font Size: <span className="text-green-600">{fontSize}px</span>
                  </label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={12}
                    max={72}
                    step={2}
                    className="w-full mb-3"
                  />
                  <div className="flex justify-between text-sm font-medium text-black">
                    <span className="bg-white px-2 py-1 rounded border">12px (Small)</span>
                    <span className="bg-white px-2 py-1 rounded border">72px (Large)</span>
                  </div>
                </div>

                {/* Text Width Control */}
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <label className="block text-lg font-bold text-black mb-3">
                    📐 Text Width: <span className="text-purple-600">{textWidth}%</span>
                  </label>
                  <Slider
                    value={[textWidth]}
                    onValueChange={(value) => setTextWidth(value[0])}
                    min={40}
                    max={100}
                    step={5}
                    className="w-full mb-3"
                  />
                  <div className="flex justify-between text-sm font-medium text-black">
                    <span className="bg-white px-2 py-1 rounded border">40% (Narrow)</span>
                    <span className="bg-white px-2 py-1 rounded border">100% (Full Width)</span>
                  </div>
                </div>

                {/* Reset Button */}
                <Button 
                  onClick={resetToDefault}
                  variant="outline"
                  className="w-full text-black border-2 border-gray-400 hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h4 className="text-xl font-bold text-blue-700 border-b border-blue-300 pb-2 mb-4">⌨️ Keyboard Shortcuts</h4>
                
                <div className="space-y-4">
                  {/* Navigation Shortcuts */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h5 className="font-bold text-blue-800 mb-3 text-lg">🧭 Navigation</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Go to Top:</span>
                        <kbd className="bg-blue-200 px-2 py-1 rounded font-mono font-bold text-blue-900">H</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Go to Bottom:</span>
                        <kbd className="bg-blue-200 px-2 py-1 rounded font-mono font-bold text-blue-900">B</kbd>
                      </div>
                      {navMarkers.length > 0 && (
                        <>
                          <div className="flex justify-between items-center bg-white p-2 rounded">
                            <span className="font-semibold text-black">Next Marker:</span>
                            <kbd className="bg-purple-200 px-2 py-1 rounded font-mono font-bold text-purple-900">N</kbd>
                          </div>
                          <div className="flex justify-between items-center bg-white p-2 rounded">
                            <span className="font-semibold text-black">Previous Marker:</span>
                            <kbd className="bg-purple-200 px-2 py-1 rounded font-mono font-bold text-purple-900">P</kbd>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Playback & Speed Shortcuts */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h5 className="font-bold text-green-800 mb-3 text-lg">▶️ Playback & Speed</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Play/Pause:</span>
                        <kbd className="bg-green-200 px-2 py-1 rounded font-mono font-bold text-green-900">Space</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Speed Up:</span>
                        <kbd className="bg-green-200 px-2 py-1 rounded font-mono font-bold text-green-900">→</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Slow Down:</span>
                        <kbd className="bg-green-200 px-2 py-1 rounded font-mono font-bold text-green-900">←</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Fine Speed +:</span>
                        <kbd className="bg-orange-200 px-2 py-1 rounded font-mono font-bold text-orange-900">+</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Fine Speed -:</span>
                        <kbd className="bg-orange-200 px-2 py-1 rounded font-mono font-bold text-orange-900">-</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Additional Controls */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h5 className="font-bold text-gray-800 mb-3 text-lg">🎛️ Other Controls</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Mirror Text:</span>
                        <kbd className="bg-indigo-200 px-2 py-1 rounded font-mono font-bold text-indigo-900">M</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Fullscreen:</span>
                        <kbd className="bg-indigo-200 px-2 py-1 rounded font-mono font-bold text-indigo-900">F</kbd>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded">
                        <span className="font-semibold text-black">Exit:</span>
                        <kbd className="bg-red-200 px-2 py-1 rounded font-mono font-bold text-red-900">Esc</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Support Info */}
                  <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 text-center">
                      ⌨️ Compatible with USB and Bluetooth keyboards<br/>
                      🎯 Perfect for hands-free operation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                ✅ Close Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}