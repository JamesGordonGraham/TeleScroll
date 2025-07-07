import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Info } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const teleprompterShortcuts = [
    { action: 'Play / Pause', key: 'Space' },
    { action: 'Increase Speed', key: '↑' },
    { action: 'Decrease Speed', key: '↓' },
    { action: 'Increase Text Size', key: '+' },
    { action: 'Decrease Text Size', key: '-' },
    { action: 'Flip Text Horizontally', key: 'F' },
    { action: 'Exit Teleprompter', key: 'Esc' },
  ];

  const generalShortcuts = [
    { action: 'Open Settings', key: 'Ctrl + ,' },
    { action: 'Toggle Fullscreen', key: 'F11' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Teleprompter Controls</h4>
            <div className="space-y-2">
              {teleprompterShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{shortcut.action}</span>
                  <kbd className="bg-white px-3 py-1 rounded border text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">General</h4>
            <div className="space-y-2">
              {generalShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{shortcut.action}</span>
                  <kbd className="bg-white px-3 py-1 rounded border text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Bluetooth Keyboard Support</p>
              <p>All keyboard shortcuts work with Bluetooth keyboards. Make sure your device is paired and connected.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
