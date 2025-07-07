import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onPlayPause?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
  onTextSizeUp?: () => void;
  onTextSizeDown?: () => void;
  onFlip?: () => void;
  onExit?: () => void;
  onSettings?: () => void;
  onFullscreen?: () => void;
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
        'Equal',
        'Minus',
        'NumpadAdd',
        'NumpadSubtract',
        'KeyF',
        'Escape',
        'F11'
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
          handlers.onSpeedUp?.();
          break;
        case 'ArrowDown':
          handlers.onSpeedDown?.();
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
