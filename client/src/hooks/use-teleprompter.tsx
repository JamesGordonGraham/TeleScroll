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
    // TODO: Implement clean video recording system
    console.log('Video recording temporarily disabled for rebuild');
  }, []);

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
    // TODO: Implement clean video recording stop
    console.log('Video recording stop temporarily disabled for rebuild');
    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      cameraStream: null 
    }));
  }, []);

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
    
    // Clean CSS animation-based scrolling
    const scrollContent = element.querySelector('.scroll-content') as HTMLElement;
    if (!scrollContent) return;
    
    // Calculate animation duration based on speed (slower speed = longer duration)
    const baseSpeed = 60; // 60 seconds for 1.0x speed
    const duration = baseSpeed / settings.scrollSpeed;
    
    // Apply CSS animation
    scrollContent.style.animation = `teleprompterScroll ${duration}s linear infinite`;
    
    console.log(`Started CSS scrolling at ${settings.scrollSpeed}x speed (${duration}s duration)`);
  }, [settings]);

  const stopScrolling = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    // Stop CSS animation
    const scrollContent = element.querySelector('.scroll-content') as HTMLElement;
    if (scrollContent) {
      scrollContent.style.animation = 'none';
      console.log('Stopped CSS scrolling');
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
