import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Video, 
  Sparkles, 
  Crown, 
  LogOut, 
  Settings,
  Clock,
  Zap,
  Star,
  Type,
  Edit,
  Mic
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { FileImport } from "@/components/FileImport";
import VoiceInput from "@/components/VoiceInput";
import { AIScriptAssistant } from "@/components/AIScriptAssistant";
import { VideoRecorder } from "@/components/VideoRecorder";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import SavedScriptsModal from "@/components/SavedScriptsModal";
import TrialExpiredPopup from "@/components/TrialExpiredPopup";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Teleprompter from "./Teleprompter";
import logo from "@assets/Vibe prompting logo v1 18 jul 2025_1753096193955.png";

interface HomeProps {
  content: string;
  setContent: (content: string | ((prev: string) => string)) => void;
}

export default function Home({ content, setContent }: HomeProps) {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading, createSubscription } = useSubscription();
  const { toast } = useToast();
  
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [activeSection, setActiveSection] = useState("scripts");

  // Auto-show trial expired popup when user hits limit
  useEffect(() => {
    if (subscription?.tier === 'free' && (subscription.usage || 0) >= (subscription.usageLimit || 60)) {
      setShowTrialExpired(true);
    }
  }, [subscription]);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showSavedScripts, setShowSavedScripts] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleScriptGenerated = (script: string) => {
    setContent(script);
    setActiveSection("scripts");
    toast({
      title: "Script Generated",
      description: "Your AI-generated script is ready in the editor!",
    });
  };

  const clearContent = () => {
    setContent("");
  };

  const handleSaveScript = async () => {
    if (!content.trim()) return;
    
    try {
      const response = await apiRequest('POST', '/api/scripts', {
        title: `Script ${new Date().toLocaleDateString()}`,
        content: content,
      });
      
      // Invalidate scripts cache to refresh the SavedScriptsModal
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      
      toast({
        title: "Script saved",
        description: "Your script has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save script. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return Crown;
      case 'pro': return Zap;
      default: return Star;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'from-purple-600 to-blue-600';
      case 'pro': return 'from-blue-600 to-cyan-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  // Handle trial expired popup
  const handleTrialExpiredUpgrade = async (plan: 'pro' | 'premium') => {
    const priceId = plan === 'pro' ? 'price_pro' : 'price_premium';
    try {
      await createSubscription.mutateAsync(priceId);
      setShowTrialExpired(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  // Function to show trial expired popup when APIs return trial expired flag
  const handleTrialExpired = () => {
    setShowTrialExpired(true);
  };

  const handleStartTeleprompter = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please add some text before starting the teleprompter",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user can start teleprompter (trial limit check)
      const response = await apiRequest("POST", "/api/teleprompter/start");
      if (response.ok) {
        setShowTeleprompter(true);
      }
    } catch (error: any) {
      if (error.message.includes("60-minute trial limit")) {
        handleTrialExpired();
      } else {
        toast({
          title: "Error",
          description: "Failed to start teleprompter. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExitTeleprompter = () => {
    setShowTeleprompter(false);
  };

  const handleVoiceInput = (text: string) => {
    // Append voice text to existing content with proper spacing
    setContent(prev => {
      if (!prev.trim()) return text;
      return prev + (prev.endsWith('\n') ? '' : '\n\n') + text;
    });
    toast({
      title: "Voice Text Added",
      description: "Your speech has been converted to text and added to the script.",
    });
  };

  if (showTeleprompter) {
    return <Teleprompter content={content} onExit={handleExitTeleprompter} />;
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Teleprompter" className="h-16 w-auto" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Teleprompter / Autocue
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Info & Subscription Status */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName || user.email || 'User'}
                  </p>
                  {subscription && (
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="secondary" 
                        className={`bg-gradient-to-r ${getTierColor(subscription.tier)} text-white border-none`}
                      >
                        {React.createElement(getTierIcon(subscription.tier), { className: "h-3 w-3 mr-1" })}
                        {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                      </Badge>
                      {subscription.tier === 'free' && (
                        <span className="text-xs text-gray-500">
                          {subscription.usage || 0}/{subscription.usageLimit || 60}min
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {user.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Navigation Panel - Only visible on very large screens (1200px+) */}
        <div className="hidden xl:block w-64 bg-white/50 backdrop-blur-sm border-r border-white/20 p-4">
          <nav className="space-y-2">
            {/* Free Plan Usage under Settings */}
            {subscription?.tier === 'free' && (
              <div className="mx-2 mt-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">Free Plan Usage</span>
                  </div>
                  <span className="text-xs text-blue-700">
                    {subscription.usage || 0}/{subscription.usageLimit || 60}min
                  </span>
                </div>
                <Progress 
                  value={((subscription.usage || 0) / (subscription.usageLimit || 60)) * 100} 
                  className="mb-2 h-1"
                />
                <p className="text-xs text-blue-700">
                  Upgrade to Pro for unlimited usage or Premium for AI features
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">
                Premium Features
              </p>
              
              <button 
                onClick={() => setActiveSection("ai-assistant")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "ai-assistant" 
                    ? "bg-purple-100 text-purple-700 font-medium" 
                    : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                <Sparkles className="h-5 w-5" />
                AI Script Assistant
                <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 text-xs">
                  Premium
                </Badge>
              </button>
              
              <button 
                onClick={() => setActiveSection("improve-script")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "improve-script" 
                    ? "bg-blue-100 text-blue-700 font-medium" 
                    : "text-gray-700 hover:bg-blue-50"
                }`}
              >
                <Edit className="h-5 w-5" />
                Improve Existing Script
                <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs">
                  Premium
                </Badge>
              </button>
              
              <button 
                onClick={() => setActiveSection("voice-input")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "voice-input" 
                    ? "bg-green-100 text-green-700 font-medium" 
                    : "text-gray-700 hover:bg-green-50"
                }`}
              >
                <Mic className="h-5 w-5" />
                Voice Input
                <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 text-xs">
                  Premium
                </Badge>
              </button>
            </div>

            <button 
              onClick={() => setActiveSection("upgrade")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 hover:from-yellow-200 hover:to-orange-200 font-medium mt-4`}
            >
              <Crown className="h-5 w-5" />
              Upgrade to Premium
            </button>
          </nav>
        </div>

        {/* Main Content Area - Full width on mobile/tablet, flex-1 on very large desktop */}
        <div className="flex-1 p-4 xl:p-6 overflow-auto">

          {/* Scripts Section - Always show script editor, mobile navigation below */}
          <div className="space-y-6">
            {/* Central Script Editor */}
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent>
                <FileImport 
                  content={content} 
                  setContent={setContent} 
                  onStartTeleprompter={handleStartTeleprompter}
                  onVoiceInput={() => setShowVoiceInput(true)}
                />
                
                <div className="mt-6 flex gap-3 justify-between">
                  <Button 
                    onClick={() => setShowSavedScripts(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Load Saved Scripts
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={clearContent}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={!content}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleSaveScript}
                      variant="outline"
                      className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                      disabled={!content}
                    >
                      Save Script
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Input Modal */}
            {showVoiceInput && (
              <VoiceInput 
                onVoiceInput={handleVoiceInput}
                onClose={() => setShowVoiceInput(false)}
                onTrialExpired={handleTrialExpired}
              />
            )}

            {/* Mobile Navigation Buttons - Below Script Editor on Mobile/Tablet */}
            <div className="xl:hidden space-y-4 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setActiveSection("ai-assistant")}
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto text-black border-gray-300 hover:bg-gray-50"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>AI Script Assistant</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveSection("improve-script")}
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto text-black border-gray-300 hover:bg-gray-50"
                >
                  <Edit className="h-5 w-5" />
                  <span>Improve Script</span>
                </Button>
              </div>
              
              {/* Additional row for Video Capture, Captions and Upgrade */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setActiveSection("video-capture")}
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto text-black border-gray-300 hover:bg-gray-50"
                >
                  <Video className="h-5 w-5" />
                  <span>Video Capture</span>
                </Button>
                <Button 
                  onClick={() => setActiveSection("captions")}
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto text-black border-gray-300 hover:bg-gray-50"
                >
                  <Type className="h-5 w-5" />
                  <span>Captions</span>
                </Button>
                <Button 
                  onClick={() => setActiveSection("upgrade")}
                  variant="outline"
                  className="flex items-center gap-2 p-4 h-auto bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-300 hover:from-yellow-200 hover:to-orange-200"
                >
                  <Crown className="h-5 w-5" />
                  <span>Upgrade</span>
                </Button>
              </div>

              {/* Mobile Free Plan Usage */}
              {subscription?.tier === 'free' && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800">Free Plan Usage</span>
                    </div>
                    <span className="text-xs text-amber-700">
                      {subscription.usage || 0}/{subscription.usageLimit || 60}min
                    </span>
                  </div>
                  <Progress 
                    value={((subscription.usage || 0) / (subscription.usageLimit || 60)) * 100} 
                    className="mb-2 h-1"
                  />
                  <p className="text-xs text-amber-700">
                    Upgrade to Pro for unlimited usage or Premium for AI features
                  </p>
                </div>
              )}
            </div>

            {/* Desktop AI Assistant - Hidden on mobile/tablet */}
            <div className="hidden xl:block max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-blue-700 mb-4">AI Script Assistant - get help in Writing new Scripts</h3>
              <AIScriptAssistant onScriptGenerated={handleScriptGenerated} onTrialExpired={handleTrialExpired} />
            </div>
          </div>

          {/* Other Sections - Only show when not on mobile or when specifically selected */}
          {activeSection === "scripts" && (
            <div className="hidden">
              {/* This is now handled above */}
            </div>
          )}



          {/* AI Assistant Section */}
          {activeSection === "ai-assistant" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">AI Script Assistant</h2>
                <p className="text-blue-600 mb-8">Generate professional scripts for any occasion with AI</p>
              </div>
              <AIScriptAssistant onScriptGenerated={handleScriptGenerated} onTrialExpired={handleTrialExpired} />
            </div>
          )}

          {/* Improve Script Section */}
          {activeSection === "improve-script" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">Improve Existing Script</h2>
                <p className="text-blue-600 mb-8">Enhance your scripts with AI-powered suggestions and improvements</p>
              </div>
              
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-blue-600" />
                    Script Enhancement
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Improve clarity, flow, and impact of your existing scripts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Paste your script above and our AI will provide suggestions to improve:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Clarity and readability</li>
                    <li>• Flow and pacing</li>
                    <li>• Word choice and impact</li>
                    <li>• Structure and organization</li>
                  </ul>
                  <Button 
                    disabled={!content}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Improve Script
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Voice Input Section */}
          {activeSection === "voice-input" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">Voice Input</h2>
                <p className="text-blue-600 mb-8">Convert your speech to text with real-time voice recognition</p>
              </div>
              
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-green-600" />
                    Speech-to-Text
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Speak naturally and convert your voice to text instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Features include:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Real-time speech recognition</li>
                    <li>• Automatic punctuation</li>
                    <li>• Continuous voice capture</li>
                    <li>• High accuracy transcription</li>
                  </ul>
                  <Button 
                    onClick={() => setShowVoiceInput(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Voice Input
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upgrade Section */}
          {activeSection === "upgrade" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">Upgrade Your Plan</h2>
                <p className="text-blue-600 mb-8">Unlock powerful features with Pro or Premium</p>
              </div>
              <SubscriptionPlans />
            </div>
          )}
        </div>
      </div>

      {/* Video Recorder Modal */}
      <VideoRecorder 
        isVisible={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)} 
      />

      {/* Saved Scripts Modal */}
      <SavedScriptsModal
        isOpen={showSavedScripts}
        onClose={() => setShowSavedScripts(false)}
        onLoadScript={setContent}
      />

      {/* Trial Expired Popup */}
      <TrialExpiredPopup
        isOpen={showTrialExpired}
        onClose={() => setShowTrialExpired(false)}
        onUpgrade={handleTrialExpiredUpgrade}
      />
    </div>
  );
}