import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onPlayPause?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
  onTextSizeUp?: () => void;
  onTextSizeDown?: () => void;
  onLineHeightUp?: () => void;
  onLineHeightDown?: () => void;
  onTextWidthUp?: () => void;
  onTextWidthDown?: () => void;
  onFlip?: () => void;
  onExit?: () => void;
  onSettings?: () => void;
  onFullscreen?: () => void;
  onGoToTop?: () => void;
  onGoToBottom?: () => void;
  onAddMarker?: () => void;
  onNextMarker?: () => void;
  onPreviousMarker?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      const isOurShortcut = [
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Equal',
        'Minus',
        'NumpadAdd',
        'NumpadSubtract',
        'KeyF',
        'Escape',
        'F11',
        'KeyH',
        'KeyB',
        'Home',
        'End',
        'KeyM',
        'KeyN',
        'KeyP'
      ].includes(event.code);

      if (isOurShortcut) {
        event.preventDefault();
      }

      // Handle shortcuts
      switch (event.code) {
        case 'Space':
          handlers.onPlayPause?.();
          break;
        case 'ArrowUp':
          if (event.shiftKey) {
            handlers.onLineHeightUp?.();
          } else {
            handlers.onSpeedUp?.();
          }
          break;
        case 'ArrowDown':
          if (event.shiftKey) {
            handlers.onLineHeightDown?.();
          } else {
            handlers.onSpeedDown?.();
          }
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            handlers.onTextWidthDown?.();
          }
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            handlers.onTextWidthUp?.();
          }
          break;
        case 'Equal':
        case 'NumpadAdd':
          if (event.shiftKey || event.code === 'NumpadAdd') {
            handlers.onTextSizeUp?.();
          }
          break;
        case 'Minus':
        case 'NumpadSubtract':
          handlers.onTextSizeDown?.();
          break;
        case 'KeyF':
          handlers.onFlip?.();
          break;
        case 'Escape':
          handlers.onExit?.();
          break;
        case 'F11':
          handlers.onFullscreen?.();
          break;
        case 'Comma':
          if (event.ctrlKey || event.metaKey) {
            handlers.onSettings?.();
          }
          break;
        case 'KeyH':
        case 'Home':
          handlers.onGoToTop?.();
          break;
        case 'KeyB':
        case 'End':
          handlers.onGoToBottom?.();
          break;
        case 'KeyM':
          handlers.onAddMarker?.();
          break;
        case 'KeyN':
          handlers.onNextMarker?.();
          break;
        case 'KeyP':
          handlers.onPreviousMarker?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
