import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { TeleprompterSettings } from '@shared/schema';

interface TeleprompterState {
  isPlaying: boolean;
  isFlipped: boolean;
  currentPosition: number;
  isFullscreen: boolean;
  markers: number[];
  currentMarkerIndex: number;
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
  });

  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

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

    // 8-layer interpolation system for maximum smoothness
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
    
    const ultraSmoothScroll = (currentTime: number) => {
      if (!state.isPlaying || !element) return;
      
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016); // Cap at 16ms for stability
      lastTime = currentTime;
      
      // Get current speed settings for instant real-time updates
      const currentSpeed = Math.max(0.1, Math.min(3.0, settings.scrollSpeed));
      // Doubled the base speed: 0.1x-1.0x range now twice as fast as before
      // Current baseline (1.0x) = 160 pixels/sec, 3.0x will be significantly faster
      const basePixelsPerSecond = 160;
      const scaledSpeed = Math.pow(currentSpeed, 1.3); // Exponential scaling for dramatic differences
      const pixelsPerSecond = basePixelsPerSecond * scaledSpeed;
      
      // Layer 1: Calculate ideal target position with immediate speed response
      targetPosition += pixelsPerSecond * deltaTime;
      
      // 8-layer ultra-smooth interpolation system with gentler factors for jerk-free movement
      // Layer 2: Ultra-gentle response (0.12)
      const diff1 = targetPosition - smoothPosition1;
      smoothPosition1 += diff1 * 0.12;
      
      // Layer 3: Very gentle response (0.16)
      const diff2 = smoothPosition1 - smoothPosition2;
      smoothPosition2 += diff2 * 0.16;
      
      // Layer 4: Gentle response (0.20)
      const diff3 = smoothPosition2 - smoothPosition3;
      smoothPosition3 += diff3 * 0.20;
      
      // Layer 5: Medium-gentle response (0.24)
      const diff4 = smoothPosition3 - smoothPosition4;
      smoothPosition4 += diff4 * 0.24;
      
      // Layer 6: Medium response (0.28)
      const diff5 = smoothPosition4 - smoothPosition5;
      smoothPosition5 += diff5 * 0.28;
      
      // Layer 7: Medium-smooth response (0.32)
      const diff6 = smoothPosition5 - smoothPosition6;
      smoothPosition6 += diff6 * 0.32;
      
      // Layer 8: Smooth response (0.36)
      const diff7 = smoothPosition6 - smoothPosition7;
      smoothPosition7 += diff7 * 0.36;
      
      // Layer 9: Final ultra-smooth output (0.40)
      const diff8 = smoothPosition7 - smoothPosition8;
      smoothPosition8 += diff8 * 0.40;
      
      // Apply the final 8-layer ultra-smooth position
      element.scrollTop = smoothPosition8;
      setState(prev => ({ ...prev, currentPosition: element.scrollTop }));
      
      animationRef.current = requestAnimationFrame(ultraSmoothScroll);
    };
    
    animationRef.current = requestAnimationFrame(ultraSmoothScroll);
  }, [settings, state.isPlaying]);

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

  const goToTop = useCallback(() => {
    setState(prev => ({ ...prev, currentPosition: 0 }));
  }, []);

  const goToBottom = useCallback((element?: HTMLElement | null) => {
    if (element) {
      element.scrollTop = element.scrollHeight;
      setState(prev => ({ ...prev, currentPosition: element.scrollHeight }));
    } else {
      setState(prev => ({ ...prev, currentPosition: 100000 })); // Large number to go to bottom
    }
  }, []);

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
    const currentScrollRatio = element.scrollTop / (element.scrollHeight - element.clientHeight);
    const currentCharPosition = Math.floor(currentScrollRatio * content.length);
    
    // Find the next marker
    const nextMarkerIndex = markerPositions.find(pos => pos > currentCharPosition);
    if (nextMarkerIndex !== undefined) {
      const targetScrollRatio = nextMarkerIndex / content.length;
      const targetScrollTop = targetScrollRatio * (element.scrollHeight - element.clientHeight);
      element.scrollTop = Math.max(0, Math.min(targetScrollTop, element.scrollHeight - element.clientHeight));
    }
  }, []);

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
    const currentScrollRatio = element.scrollTop / (element.scrollHeight - element.clientHeight);
    const currentCharPosition = Math.floor(currentScrollRatio * content.length);
    
    // Find the previous marker
    const prevMarkerIndex = markerPositions.reverse().find(pos => pos < currentCharPosition);
    if (prevMarkerIndex !== undefined) {
      const targetScrollRatio = prevMarkerIndex / content.length;
      const targetScrollTop = targetScrollRatio * (element.scrollHeight - element.clientHeight);
      element.scrollTop = Math.max(0, Math.min(targetScrollTop, element.scrollHeight - element.clientHeight));
    }
  }, []);

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
