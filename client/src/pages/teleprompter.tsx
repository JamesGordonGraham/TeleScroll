import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileImport } from '@/components/FileImport';
import { TeleprompterDisplay } from '@/components/TeleprompterDisplay';
import { SettingsModal } from '@/components/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ScrollText, Keyboard, Settings } from 'lucide-react';

export default function TeleprompterPage() {
  const [mode, setMode] = useState<'import' | 'teleprompter'>('import');
  const [currentContent, setCurrentContent] = useState('Welcome to Vibe Prompting! This is a sample script to demonstrate the teleprompter functionality. You can edit this text or import your own file.\n\nYour teleprompter will display text in large, readable fonts with smooth scrolling. Use the keyboard controls to adjust speed, pause, and navigate through your script.\n\nThe application supports various text formatting and provides a distraction-free reading experience perfect for presentations, speeches, and video recordings.');
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
    <div className="min-h-screen">
      {mode === 'import' && (
        <>
          {/* Header */}
          <header className="apple-card mx-4 mt-4 rounded-2xl">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-4">
                  <img 
                    src="/vibe-prompting-logo.png" 
                    alt="Vibe Prompting Logo" 
                    className="h-12 w-auto object-contain"
                  />
                  <h1 className="text-2xl font-bold gradient-text">Vibe Prompting</h1>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowShortcuts(true)}
                    className="btn-apple rounded-2xl px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <Keyboard className="h-4 w-4" />
                    <span className="ml-2 text-sm font-medium">Shortcuts</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSettings(true)}
                    className="btn-apple rounded-2xl p-3"
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 animate-fade-in">
            <FileImport 
              onStartTeleprompter={handleStartTeleprompter} 
              content={currentContent}
              onContentChange={setCurrentContent}
            />
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
