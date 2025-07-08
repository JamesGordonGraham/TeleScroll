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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto apple-card rounded-3xl border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text text-center mb-4">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Text Settings */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold gradient-text-accent mb-4">Text Display</h4>
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
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold gradient-text mb-4">Scrolling</h4>
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
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold gradient-text-accent mb-4">Display</h4>
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
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold gradient-text mb-4">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
              {/* Playback Controls */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Playback</h5>
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
              </div>
              
              {/* Text Controls */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Text</h5>
                <div className="flex justify-between">
                  <span>Text Size +/-</span>
                  <div className="space-x-1">
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">+</kbd>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">-</kbd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Flip Text</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">F</kbd>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Navigation</h5>
                <div className="flex justify-between">
                  <span>Go to Top</span>
                  <div className="space-x-1">
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">H</kbd>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Home</kbd>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Go to Bottom</span>
                  <div className="space-x-1">
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">B</kbd>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">End</kbd>
                  </div>
                </div>
              </div>
              
              {/* Markers */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Markers</h5>
                <div className="flex justify-between">
                  <span>Add Marker</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">M</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Next Marker</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">N</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Previous Marker</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">P</kbd>
                </div>
              </div>
              
              {/* System */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 text-xs uppercase tracking-wide">System</h5>
                <div className="flex justify-between">
                  <span>Settings</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Ctrl + ,</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Fullscreen</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">F11</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Exit</span>
                  <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={resetSettings}
            disabled={isUpdatingSettings}
            className="btn-apple rounded-2xl px-6 py-3 font-medium"
          >
            Reset to Default
          </Button>
          <Button
            onClick={onClose}
            disabled={isUpdatingSettings}
            className="gradient-bg-primary text-white rounded-2xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
