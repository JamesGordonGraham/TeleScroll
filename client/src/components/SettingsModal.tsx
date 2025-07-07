import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTeleprompter } from '@/hooks/use-teleprompter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, isUpdatingSettings } = useTeleprompter();

  if (!settings) return null;

  const handleFontSizeChange = (value: number[]) => {
    updateSettings({ fontSize: value[0] });
  };

  const handleLineHeightChange = (value: string) => {
    updateSettings({ lineHeight: parseFloat(value) });
  };

  const handleScrollSpeedChange = (value: number[]) => {
    updateSettings({ scrollSpeed: value[0] });
  };

  const handleSmoothScrollingChange = (checked: boolean) => {
    updateSettings({ smoothScrolling: checked });
  };

  const handleAutoFullscreenChange = (checked: boolean) => {
    updateSettings({ autoFullscreen: checked });
  };

  const handleHideCursorChange = (checked: boolean) => {
    updateSettings({ hideCursor: checked });
  };

  const resetSettings = () => {
    updateSettings({
      fontSize: 32,
      lineHeight: 1.6,
      scrollSpeed: 1.0,
      smoothScrolling: true,
      autoFullscreen: false,
      hideCursor: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Text Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Text Display</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700 mb-2">Font Size</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={handleFontSizeChange}
                  min={16}
                  max={72}
                  step={1}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>16px</span>
                  <span>72px</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2">Line Height</Label>
                <Select value={settings.lineHeight.toString()} onValueChange={handleLineHeightChange}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.4">Compact (1.4)</SelectItem>
                    <SelectItem value="1.6">Normal (1.6)</SelectItem>
                    <SelectItem value="1.8">Relaxed (1.8)</SelectItem>
                    <SelectItem value="2.0">Loose (2.0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Scrolling Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Scrolling</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700 mb-2">Default Speed</Label>
                <Slider
                  value={[settings.scrollSpeed]}
                  onValueChange={handleScrollSpeedChange}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.1x</span>
                  <span>3.0x</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smooth-scrolling"
                  checked={settings.smoothScrolling}
                  onCheckedChange={handleSmoothScrollingChange}
                />
                <Label htmlFor="smooth-scrolling" className="text-sm text-gray-700">
                  Smooth scrolling
                </Label>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Display</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-fullscreen"
                  checked={settings.autoFullscreen}
                  onCheckedChange={handleAutoFullscreenChange}
                />
                <Label htmlFor="auto-fullscreen" className="text-sm text-gray-700">
                  Auto fullscreen on start
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hide-cursor"
                  checked={settings.hideCursor}
                  onCheckedChange={handleHideCursorChange}
                />
                <Label htmlFor="hide-cursor" className="text-sm text-gray-700">
                  Hide cursor in teleprompter mode
                </Label>
              </div>
            </div>
          </div>

          {/* Keyboard Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Keyboard Shortcuts</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Play/Pause</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span>Speed Up/Down</span>
                <div className="space-x-1">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">↑</kbd>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">↓</kbd>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Text Size</span>
                <div className="space-x-1">
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">+</kbd>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">-</kbd>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Flip Text</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">F</kbd>
              </div>
              <div className="flex justify-between">
                <span>Exit</span>
                <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={resetSettings}
            disabled={isUpdatingSettings}
          >
            Reset to Default
          </Button>
          <Button
            onClick={onClose}
            disabled={isUpdatingSettings}
          >
            {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
