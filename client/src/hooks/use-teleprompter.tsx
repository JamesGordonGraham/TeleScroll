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
        
        // Instantly move to new position
        element.scrollTop = targetPosition;
        
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
      
      // Get current speed settings for instant real-time updates
      const currentSpeed = Math.max(0.1, Math.min(3.0, settings.scrollSpeed));
      // Doubled the base speed: 0.1x-1.0x range now twice as fast as before
      // Current baseline (1.0x) = 160 pixels/sec, 3.0x will be significantly faster
      const basePixelsPerSecond = 160;
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
      
      // Apply the final 12-layer ultra-smooth position
      element.scrollTop = smoothPosition12;
      setState(prev => ({ ...prev, currentPosition: element.scrollTop }));
      
      animationRef.current = requestAnimationFrame(ultraSmoothScroll);
    };
    
    animationRef.current = requestAnimationFrame(ultraSmoothScroll);
  }, [settings, state.isPlaying, state.currentPosition]);

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
