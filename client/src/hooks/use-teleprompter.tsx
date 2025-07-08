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
    const newSize = Math.max(16, Math.min(72, settings.fontSize + delta));
    updateSettingsMutation.mutate({ fontSize: newSize });
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

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    const scrollSpeed = settings.scrollSpeed;
    const pixelsPerSecond = 50 * scrollSpeed;
    const intervalMs = 16; // ~60fps
    const pixelsPerFrame = (pixelsPerSecond * intervalMs) / 1000;

    scrollIntervalRef.current = setInterval(() => {
      if (state.isPlaying) {
        element.scrollTop += pixelsPerFrame;
        setState(prev => ({ ...prev, currentPosition: element.scrollTop }));
      }
    }, intervalMs);
  }, [settings, state.isPlaying]);

  const stopScrolling = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
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

  const nextMarker = useCallback((element?: HTMLElement | null) => {
    if (!element) return;
    
    const content = element.textContent || '';
    const markerPositions = [];
    let index = 0;
    
    // Find all marker positions in the content
    while (index < content.length) {
      const markerIndex = content.indexOf('■', index);
      if (markerIndex === -1) break;
      markerPositions.push(markerIndex);
      index = markerIndex + 1;
    }
    
    // Find the next marker after current scroll position
    const currentScrollRatio = element.scrollTop / (element.scrollHeight - element.clientHeight);
    const currentCharPosition = Math.floor(currentScrollRatio * content.length);
    
    const nextMarkerIndex = markerPositions.find(pos => pos > currentCharPosition);
    if (nextMarkerIndex !== undefined) {
      const targetScrollRatio = nextMarkerIndex / content.length;
      const targetScrollTop = targetScrollRatio * (element.scrollHeight - element.clientHeight);
      element.scrollTop = targetScrollTop;
    }
  }, []);

  const previousMarker = useCallback((element?: HTMLElement | null) => {
    if (!element) return;
    
    const content = element.textContent || '';
    const markerPositions = [];
    let index = 0;
    
    // Find all marker positions in the content
    while (index < content.length) {
      const markerIndex = content.indexOf('■', index);
      if (markerIndex === -1) break;
      markerPositions.push(markerIndex);
      index = markerIndex + 1;
    }
    
    // Find the previous marker before current scroll position
    const currentScrollRatio = element.scrollTop / (element.scrollHeight - element.clientHeight);
    const currentCharPosition = Math.floor(currentScrollRatio * content.length);
    
    const prevMarkerIndex = markerPositions.reverse().find(pos => pos < currentCharPosition);
    if (prevMarkerIndex !== undefined) {
      const targetScrollRatio = prevMarkerIndex / content.length;
      const targetScrollTop = targetScrollRatio * (element.scrollHeight - element.clientHeight);
      element.scrollTop = targetScrollTop;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
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
