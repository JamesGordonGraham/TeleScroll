import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileImport } from '@/components/FileImport';
import { TeleprompterDisplay } from '@/components/TeleprompterDisplay';
import { SettingsModal } from '@/components/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ScrollText, Keyboard, Settings } from 'lucide-react';

export default function TeleprompterPage() {
  const [mode, setMode] = useState<'import' | 'teleprompter'>('import');
  const [currentContent, setCurrentContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleStartTeleprompter = async (content: string) => {
    setCurrentContent(content);
    setMode('teleprompter');
    
    // Request fullscreen if supported
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.log('Fullscreen not supported or denied');
    }
  };

  const handleExitTeleprompter = async () => {
    setMode('import');
    
    // Exit fullscreen if in fullscreen mode
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.log('Error exiting fullscreen');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {mode === 'import' && (
        <>
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <ScrollText className="h-8 w-8 text-blue-600" />
                  <h1 className="text-xl font-semibold text-gray-900">TelePrompter Pro</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowShortcuts(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Keyboard className="h-4 w-4" />
                    <span className="ml-2 text-sm">Shortcuts</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSettings(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <FileImport onStartTeleprompter={handleStartTeleprompter} />
          </main>
        </>
      )}

      {mode === 'teleprompter' && (
        <TeleprompterDisplay
          content={currentContent}
          onExit={handleExitTeleprompter}
          onShowSettings={() => setShowSettings(true)}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
