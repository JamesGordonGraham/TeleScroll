import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onPlayPause?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
  onTextSizeUp?: () => void;
  onTextSizeDown?: () => void;
  onTextWidthUp?: () => void;
  onTextWidthDown?: () => void;
  onFlip?: () => void;
  onExit?: () => void;
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
      // Skip if user is typing in an input field
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
      
      if (isInputActive) return;

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
        event.stopPropagation();
      }

      // Handle shortcuts
      console.log('Keyboard shortcut triggered:', event.code, 'isPlaying:', document.querySelector('[data-teleprompter-active]'));
      switch (event.code) {
        case 'Space':
          console.log('Space key - Play/Pause');
          handlers.onPlayPause?.();
          break;
        case 'ArrowUp':
          console.log('Arrow Up - Speed Up');
          handlers.onSpeedUp?.();
          break;
        case 'ArrowDown':
          console.log('Arrow Down - Speed Down');
          handlers.onSpeedDown?.();
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            console.log('Shift+Arrow Left - Text Width Down');
            handlers.onTextWidthDown?.();
          } else {
            console.log('Arrow Left - Previous Marker');
            handlers.onPreviousMarker?.();
          }
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            console.log('Shift+Arrow Right - Text Width Up');
            handlers.onTextWidthUp?.();
          } else {
            console.log('Arrow Right - Next Marker');
            handlers.onNextMarker?.();
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
          console.log('H/Home key - Go to Top');
          handlers.onGoToTop?.();
          break;
        case 'KeyB':
        case 'End':
          console.log('B/End key - Go to Bottom');
          handlers.onGoToBottom?.();
          break;
        case 'KeyM':
          console.log('M key - Add Marker');
          handlers.onAddMarker?.();
          break;
        case 'KeyN':
          console.log('N key - Next Marker');
          handlers.onNextMarker?.();
          break;
        case 'KeyP':
          console.log('P key - Previous Marker');
          handlers.onPreviousMarker?.();
          break;
      }
    };

    // Use capture phase to ensure we get events before other handlers
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handlers, enabled]);
}
