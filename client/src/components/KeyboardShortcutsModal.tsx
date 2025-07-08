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
    { action: 'Go to Top', key: 'Home' },
    { action: 'Go to Bottom', key: 'End' },
    { action: 'Add Marker', key: 'M' },
    { action: 'Next Marker', key: 'N' },
    { action: 'Previous Marker', key: 'P' },
    { action: 'Exit Teleprompter', key: 'Esc' },
  ];

  const generalShortcuts = [
    { action: 'Open Settings', key: 'Ctrl + ,' },
    { action: 'Toggle Fullscreen', key: 'F11' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto apple-card rounded-3xl border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text text-center mb-6">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold gradient-text-accent">Teleprompter Controls</h4>
            <div className="space-y-3">
              {teleprompterShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                  <span className="text-gray-800 font-medium">{shortcut.action}</span>
                  <kbd className="bg-white shadow-md px-4 py-2 rounded-xl border-2 border-gray-100 text-sm font-mono font-semibold">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold gradient-text">General</h4>
            <div className="space-y-3">
              {generalShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl">
                  <span className="text-gray-800 font-medium">{shortcut.action}</span>
                  <kbd className="bg-white shadow-md px-4 py-2 rounded-xl border-2 border-gray-100 text-sm font-mono font-semibold">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl text-white">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-white mt-0.5 mr-4 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-2 text-lg">Bluetooth Keyboard Support</p>
              <p className="text-blue-100">All keyboard shortcuts work seamlessly with Bluetooth keyboards. Make sure your device is paired and connected for the best teleprompter experience.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
