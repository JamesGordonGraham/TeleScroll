import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { TeleprompterSettings } from '@shared/schema';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface TeleprompterState {
  isPlaying: boolean;
  isFlipped: boolean;
  currentPosition: number;
  isFullscreen: boolean;
  markers: number[];
  currentMarkerIndex: number;
  isTransparent: boolean;
  isRecording: boolean;
  cameraStream: MediaStream | null;
}

export function useTeleprompter() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<TeleprompterState>({
    isPlaying: false,
    isFlipped: false,
    currentPosition: 0,
    isFullscreen: false,
    markers: [],
    currentMarkerIndex: -1,
    isTransparent: false,
    isRecording: false,
    cameraStream: null,
  });

  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  // Get settings
  const { data: settings, isLoading: settingsLoading } = useQuery<TeleprompterSettings>({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<TeleprompterSettings>) => {
      const response = await apiRequest('PATCH', '/api/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const toggleFlip = useCallback(() => {
    setState(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
  }, []);

  const toggleTransparent = useCallback(() => {
    setState(prev => ({ ...prev, isTransparent: !prev.isTransparent }));
  }, []);

  // Initialize FFmpeg
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current || isFFmpegLoaded) return;
    
    try {
      console.log('Loading FFmpeg...');
      const ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      });
      
      ffmpegRef.current = ffmpeg;
      setIsFFmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
    }
  }, [isFFmpegLoaded]);

  // Load FFmpeg on mount
  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting camera recording...');
      
      // Generate completely unique filename to prevent browser caching
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const randomId = Math.random().toString(36).substr(2, 12);
      
      const filename = `teleprompter-${year}${month}${day}_${hours}${minutes}${seconds}${ms}_${randomId}.webm`;
      console.log('Recording filename generated:', filename);
      
      // Ultra-optimized camera settings for smooth recording performance
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1280 }, // Fixed lower resolution
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 20, max: 24 }, // Much lower frame rate for smooth scrolling
          facingMode: 'user'
        },
        audio: {
          echoCancellation: false, // Disable processing for better performance
          noiseSuppression: false,
          sampleRate: 22050 // Lower sample rate
        }
      });

      console.log('Camera stream obtained, tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      setState(prev => ({ ...prev, cameraStream: stream, isRecording: true }));

      // Ultra-optimized MediaRecorder for smooth scrolling during recording
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm',
        videoBitsPerSecond: 500000, // Much lower bitrate for smooth scrolling
        audioBitsPerSecond: 64000   // Lower audio bitrate
      };
      
      console.log('Using optimized MediaRecorder options:', options);
      
      const mediaRecorder = new MediaRecorder(stream, 
        MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined
      );
      mediaRecorderRef.current = mediaRecorder;
      
      // Use local chunks array (like your example)
      let chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
        console.log('Data chunk:', e.data.size, 'bytes. Total chunks:', chunks.length);
      };



      mediaRecorder.onstop = () => {
        console.log('Recording stopped. Processing', chunks.length, 'chunks...');
        
        const blob = new Blob(chunks, { type: "video/webm" });
        console.log('Final blob size:', blob.size, 'bytes');
        
        const url = URL.createObjectURL(blob);

        // Aggressive download approach to bypass browser caching
        const downloadContainer = document.getElementById('download-container') || document.body;
        
        // Clear previous downloads
        if (downloadContainer.id === 'download-container') {
          downloadContainer.innerHTML = '';
        }
        
        // Create multiple download mechanisms to ensure success
        const timestamp = Date.now();
        const uniqueFilename = `${filename}?t=${timestamp}`;
        
        // Method 1: Force download using data URL approach
        const reader = new FileReader();
        reader.onload = function() {
          const dataUrl = reader.result as string;
          const tempLink = document.createElement('a');
          tempLink.href = dataUrl;
          tempLink.download = filename;
          tempLink.style.display = 'none';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          console.log('Data URL download triggered for:', filename);
        };
        reader.readAsDataURL(blob);
        
        // Method 2: Traditional blob URL with cache busting
        const a = document.createElement('a');
        a.href = url + '#' + timestamp;
        a.download = filename;
        a.textContent = `Download ${filename}`;
        a.className = 'download-link';
        
        // Force new download context
        a.setAttribute('download', filename);
        a.setAttribute('data-filename', filename);
        a.setAttribute('data-timestamp', timestamp.toString());
        
        // Style the download link
        a.style.display = 'block';
        a.style.margin = '10px 0';
        a.style.padding = '12px 16px';
        a.style.backgroundColor = '#0ea5e9';
        a.style.color = 'white';
        a.style.textDecoration = 'none';
        a.style.borderRadius = '8px';
        a.style.fontWeight = 'bold';
        a.style.fontSize = '14px';
        a.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        a.style.transition = 'all 0.2s ease';
        
        downloadContainer.appendChild(a);
        
        // Force immediate download with multiple attempts
        setTimeout(() => a.click(), 100);
        setTimeout(() => a.click(), 500);
        
        console.log('Multiple download methods triggered for:', filename);
        console.log('Timestamp:', timestamp);
        
        // Clean up
        chunks = [];
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
      };

      mediaRecorder.start();
      console.log('Recording started with filename:', filename);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ ...prev, isRecording: false, cameraStream: null }));
      alert(`Failed to access camera: ${(error as Error).message}. Please check permissions and try again.`);
    }
  }, [isFFmpegLoaded]);

  // Convert WebM to MP4 using FFmpeg
  const convertWebMToMP4 = useCallback(async (webmBlob: Blob) => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded');
    }

    const ffmpeg = ffmpegRef.current;
    const inputFileName = 'input.webm';
    const outputFileName = 'output.mp4';

    try {
      // Write input file to FFmpeg virtual filesystem
      console.log('Writing input file to FFmpeg...');
      await ffmpeg.writeFile(inputFileName, await fetchFile(webmBlob));

      // Run FFmpeg conversion
      console.log('Running FFmpeg conversion...');
      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',  // H.264 video codec
        '-c:a', 'aac',      // AAC audio codec
        '-preset', 'fast',   // Fast encoding preset
        '-crf', '23',       // Good quality
        outputFileName
      ]);

      // Read the output file
      console.log('Reading converted MP4 file...');
      const mp4Data = await ffmpeg.readFile(outputFileName);
      const mp4Blob = new Blob([mp4Data], { type: 'video/mp4' });

      console.log('MP4 conversion successful, size:', mp4Blob.size, 'bytes');
      downloadFile(mp4Blob, 'video/mp4', '.mp4');

      // Clean up FFmpeg files
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      
      // Clear chunks after successful MP4 conversion
      recordedChunksRef.current = [];
    } catch (error) {
      console.error('FFmpeg conversion error:', error);
      throw error;
    }
  }, []);

  // Download file helper with reliable unique filenames
  const downloadFile = useCallback((blob: Blob, mimeType: string, extension: string) => {
    // Generate unique timestamp filename like your example
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `teleprompter-recording-${timestamp}${extension}`;
    
    const url = URL.createObjectURL(blob);
    
    // Create download link that stays in DOM (like your example)
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.textContent = `Download ${filename}`;
    a.style.display = 'block';
    a.style.margin = '10px';
    a.style.padding = '10px';
    a.style.backgroundColor = '#0ea5e9';
    a.style.color = 'white';
    a.style.textDecoration = 'none';
    a.style.borderRadius = '5px';
    
    // Add to body so it's visible and clickable
    document.body.appendChild(a);
    
    // Also trigger immediate download
    a.click();
    
    console.log(`Download link created: ${filename}`);
    console.log(`File size: ${blob.size} bytes`);
    
    // Clean up URL after delay but keep link visible
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, []);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (mediaRecorderRef.current && state.isRecording) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }

    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
    }

    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      cameraStream: null 
    }));
    
    // Clean up refs (recordedChunksRef cleared after download in onstop handler)
    mediaRecorderRef.current = null;
  }, [state.isRecording, state.cameraStream]);

  const adjustSpeed = useCallback((delta: number) => {
    if (!settings) return;
    const newSpeed = Math.max(0.1, Math.min(3.0, settings.scrollSpeed + delta));
    updateSettingsMutation.mutate({ scrollSpeed: newSpeed });
  }, [settings, updateSettingsMutation]);

  const adjustTextSize = useCallback((delta: number) => {
    if (!settings) return;
    const newSize = Math.max(16, Math.min(104, settings.fontSize + delta));
    updateSettingsMutation.mutate({ fontSize: newSize });
  }, [settings, updateSettingsMutation]);

  const adjustTextWidth = useCallback((delta: number) => {
    if (!settings) return;
    const newTextWidth = Math.max(25, Math.min(100, settings.textWidth + delta));
    updateSettingsMutation.mutate({ textWidth: newTextWidth });
  }, [settings, updateSettingsMutation]);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setState(prev => ({ ...prev, isFullscreen: true }));
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setState(prev => ({ ...prev, isFullscreen: false }));
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  const startScrolling = useCallback((element: HTMLElement | null) => {
    if (!element || !settings) return;

    // Clean up any existing intervals or animations
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // 12-layer interpolation system for maximum smoothness
    element.style.scrollBehavior = 'auto';
    
    let lastTime = performance.now();
    let targetPosition = element.scrollTop;
    let smoothPosition1 = element.scrollTop;
    let smoothPosition2 = element.scrollTop;
    let smoothPosition3 = element.scrollTop;
    let smoothPosition4 = element.scrollTop;
    let smoothPosition5 = element.scrollTop;
    let smoothPosition6 = element.scrollTop;
    let smoothPosition7 = element.scrollTop;
    let smoothPosition8 = element.scrollTop;
    let smoothPosition9 = element.scrollTop;
    let smoothPosition10 = element.scrollTop;
    let smoothPosition11 = element.scrollTop;
    let smoothPosition12 = element.scrollTop;
    let lastStatePosition = state.currentPosition;
    
    const ultraSmoothScroll = (currentTime: number) => {
      if (!state.isPlaying || !element) return;
      
      // Check for keyboard navigation by comparing state position with target
      const statePositionDiff = state.currentPosition - lastStatePosition;
      if (Math.abs(statePositionDiff) > 10) {
        console.log('Keyboard navigation detected, jumping from', lastStatePosition, 'to', state.currentPosition);
        
        // Immediately update positions for keyboard navigation
        targetPosition = state.currentPosition;
        lastStatePosition = state.currentPosition;
        
        // Instantly move to new position without interfering with event handling
        requestAnimationFrame(() => {
          if (element) {
            element.scrollTop = targetPosition;
          }
        });
        
        // Reset all smooth positions to sync with new position
        smoothPosition1 = targetPosition;
        smoothPosition2 = targetPosition;
        smoothPosition3 = targetPosition;
        smoothPosition4 = targetPosition;
        smoothPosition5 = targetPosition;
        smoothPosition6 = targetPosition;
        smoothPosition7 = targetPosition;
        smoothPosition8 = targetPosition;
        smoothPosition9 = targetPosition;
        smoothPosition10 = targetPosition;
        smoothPosition11 = targetPosition;
        smoothPosition12 = targetPosition;
        
        console.log('Position synchronized to:', targetPosition);
      }
      
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016); // Cap at 16ms for stability
      lastTime = currentTime;
      
      // Get current speed settings for instant real-time updates with recording optimization
      const currentSpeed = Math.max(0.1, Math.min(3.0, settings.scrollSpeed));
      // Adjust base speed based on recording state
      const basePixelsPerSecond = state.isRecording ? 120 : 160; // Slower when recording
      const scaledSpeed = Math.pow(currentSpeed, 1.3); // Exponential scaling for dramatic differences
      const pixelsPerSecond = basePixelsPerSecond * scaledSpeed;
      
      // Layer 1: Calculate ideal target position with immediate speed response
      // Continue auto-scrolling from current position
      targetPosition += pixelsPerSecond * deltaTime;
      
      // 12-layer ultra-smooth interpolation system with optimized factors for perfect fluidity
      // Layer 2: Extremely gentle response (0.06)
      const diff1 = targetPosition - smoothPosition1;
      smoothPosition1 += diff1 * 0.06;
      
      // Layer 3: Extremely gentle response (0.08)
      const diff2 = smoothPosition1 - smoothPosition2;
      smoothPosition2 += diff2 * 0.08;
      
      // Layer 4: Ultra-gentle response (0.10)
      const diff3 = smoothPosition2 - smoothPosition3;
      smoothPosition3 += diff3 * 0.10;
      
      // Layer 5: Ultra-gentle response (0.12)
      const diff4 = smoothPosition3 - smoothPosition4;
      smoothPosition4 += diff4 * 0.12;
      
      // Layer 6: Very gentle response (0.14)
      const diff5 = smoothPosition4 - smoothPosition5;
      smoothPosition5 += diff5 * 0.14;
      
      // Layer 7: Very gentle response (0.16)
      const diff6 = smoothPosition5 - smoothPosition6;
      smoothPosition6 += diff6 * 0.16;
      
      // Layer 8: Gentle response (0.18)
      const diff7 = smoothPosition6 - smoothPosition7;
      smoothPosition7 += diff7 * 0.18;
      
      // Layer 9: Gentle response (0.20)
      const diff8 = smoothPosition7 - smoothPosition8;
      smoothPosition8 += diff8 * 0.20;
      
      // Layer 10: Medium-gentle response (0.22)
      const diff9 = smoothPosition8 - smoothPosition9;
      smoothPosition9 += diff9 * 0.22;
      
      // Layer 11: Medium response (0.24)
      const diff10 = smoothPosition9 - smoothPosition10;
      smoothPosition10 += diff10 * 0.24;
      
      // Layer 12: Medium-smooth response (0.26)
      const diff11 = smoothPosition10 - smoothPosition11;
      smoothPosition11 += diff11 * 0.26;
      
      // Layer 13: Final ultra-smooth output (0.28)
      const diff12 = smoothPosition11 - smoothPosition12;
      smoothPosition12 += diff12 * 0.28;
      
      // Apply the final 12-layer ultra-smooth position using rAF to avoid blocking events
      requestAnimationFrame(() => {
        if (element) {
          element.scrollTop = smoothPosition12;
          // Only update state during normal scrolling to avoid infinite loops
          if (Math.abs(statePositionDiff) <= 10) {
            setState(prev => ({ ...prev, currentPosition: element.scrollTop }));
          }
        }
      });
      
      // Apply different performance levels based on recording state
      const maxScroll = element.scrollHeight - element.clientHeight;
      let finalPosition;
      
      if (state.isRecording) {
        // Ultra-simplified scrolling when recording - bypass all interpolation
        const speed = settings.scrollSpeed * 80; // Much slower base speed for recording
        targetPosition += speed * deltaTime;
        finalPosition = Math.max(0, Math.min(targetPosition, maxScroll));
        
        // Use transform instead of scrollTop for better performance during recording
        const scrollElement = element.querySelector('.teleprompter-content') as HTMLElement;
        if (scrollElement) {
          scrollElement.style.transform = `translateY(-${finalPosition}px)`;
        } else {
          element.scrollTop = finalPosition;
        }
      } else {
        // Full smooth scrolling when not recording
        finalPosition = Math.max(0, Math.min(smoothPosition12, maxScroll));
        
        // Reset transform and use normal scrolling
        const scrollElement = element.querySelector('.teleprompter-content') as HTMLElement;
        if (scrollElement) {
          scrollElement.style.transform = '';
        }
        element.scrollTop = finalPosition;
      }
      
      // Update state during normal scrolling only
      if (Math.abs(statePositionDiff) <= 10) {
        setState(prev => ({ ...prev, currentPosition: finalPosition }));
      }
      
      // Continue animation
      if (state.isPlaying && finalPosition < maxScroll - 1) {
        animationRef.current = requestAnimationFrame(ultraSmoothScroll);
      }
    };
    
    animationRef.current = requestAnimationFrame(ultraSmoothScroll);
  }, [settings, state.isPlaying, state.isRecording]);

  const stopScrolling = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const resetPosition = useCallback(() => {
    setState(prev => ({ ...prev, currentPosition: 0 }));
  }, []);

  const goToTop = useCallback((element?: HTMLElement | null) => {
    console.log('GoToTop: Setting position to 0');
    setState(prev => ({ ...prev, currentPosition: 0 }));
    
    // If not playing, also do immediate scroll
    if (element && !state.isPlaying) {
      element.scrollTop = 0;
    }
  }, [state.isPlaying]);

  const goToBottom = useCallback((element?: HTMLElement | null) => {
    if (element) {
      const bottomPosition = Math.max(0, element.scrollHeight - element.clientHeight);
      console.log('GoToBottom: Setting position to', bottomPosition);
      setState(prev => ({ ...prev, currentPosition: bottomPosition }));
      
      // If not playing, also do immediate scroll
      if (!state.isPlaying) {
        element.scrollTop = bottomPosition;
      }
    } else {
      setState(prev => ({ ...prev, currentPosition: 100000 }));
    }
  }, [state.isPlaying]);

  const addMarker = useCallback(() => {
    setState(prev => ({
      ...prev,
      markers: [...prev.markers, prev.currentPosition].sort((a, b) => a - b)
    }));
  }, []);

  const nextMarker = useCallback((element?: HTMLElement | null, content?: string) => {
    if (!element || !content) return;
    
    const markerPositions = [];
    let index = 0;
    
    // Find all marker positions in the original content
    while (index < content.length) {
      const markerIndex = content.indexOf('■', index);
      if (markerIndex === -1) break;
      markerPositions.push(markerIndex);
      index = markerIndex + 1;
    }
    
    if (markerPositions.length === 0) return;
    
    // Calculate current position based on scroll
    const currentScrollRatio = element.scrollTop / Math.max(1, element.scrollHeight - element.clientHeight);
    const currentCharPosition = Math.floor(currentScrollRatio * content.length);
    
    // Find the next marker
    const nextMarkerIndex = markerPositions.find(pos => pos > currentCharPosition);
    if (nextMarkerIndex !== undefined) {
      const targetScrollRatio = nextMarkerIndex / content.length;
      const targetScrollTop = targetScrollRatio * (element.scrollHeight - element.clientHeight);
      const finalPosition = Math.max(0, Math.min(targetScrollTop, element.scrollHeight - element.clientHeight));
      
      console.log('NextMarker: Setting position to', finalPosition);
      // Force update state position
      setState(prev => ({ ...prev, currentPosition: finalPosition }));
      
      // If not playing, also do immediate scroll
      if (!state.isPlaying) {
        element.scrollTop = finalPosition;
      }
    }
  }, [state.isPlaying]);

  const previousMarker = useCallback((element?: HTMLElement | null, content?: string) => {
    if (!element || !content) return;
    
    const markerPositions = [];
    let index = 0;
    
    // Find all marker positions in the original content
    while (index < content.length) {
      const markerIndex = content.indexOf('■', index);
      if (markerIndex === -1) break;
      markerPositions.push(markerIndex);
      index = markerIndex + 1;
    }
    
    if (markerPositions.length === 0) return;
    
    // Calculate current position based on scroll
    const currentScrollRatio = element.scrollTop / Math.max(1, element.scrollHeight - element.clientHeight);
    const currentCharPosition = Math.floor(currentScrollRatio * content.length);
    
    // Find the previous marker
    const prevMarkerIndex = markerPositions.reverse().find(pos => pos < currentCharPosition);
    if (prevMarkerIndex !== undefined) {
      const targetScrollRatio = prevMarkerIndex / content.length;
      const targetScrollTop = targetScrollRatio * (element.scrollHeight - element.clientHeight);
      const finalPosition = Math.max(0, Math.min(targetScrollTop, element.scrollHeight - element.clientHeight));
      
      console.log('PreviousMarker: Setting position to', finalPosition);
      // Force update state position
      setState(prev => ({ ...prev, currentPosition: finalPosition }));
      
      // If not playing, also do immediate scroll
      if (!state.isPlaying) {
        element.scrollTop = finalPosition;
      }
    }
  }, [state.isPlaying]);

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    state,
    settings,
    settingsLoading,
    togglePlay,
    toggleFlip,
    toggleTransparent,
    startRecording,
    stopRecording,
    adjustSpeed,
    adjustTextSize,
    adjustTextWidth,
    enterFullscreen,
    exitFullscreen,
    startScrolling,
    stopScrolling,
    resetPosition,
    goToTop,
    goToBottom,
    addMarker,
    nextMarker,
    previousMarker,
    updateSettings: updateSettingsMutation.mutate,
    isUpdatingSettings: updateSettingsMutation.isPending,
  };
}
