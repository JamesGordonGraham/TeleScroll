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
  Type
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { FileImport } from "@/components/FileImport";
import { AIScriptAssistant } from "@/components/AIScriptAssistant";
import { VideoRecorder } from "@/components/VideoRecorder";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Teleprompter from "./Teleprompter";
import logo from "@assets/Vibe prompting logo v1 18 jul 2025_1753096193955.png";

interface HomeProps {
  content: string;
  setContent: (content: string) => void;
}

export default function Home({ content, setContent }: HomeProps) {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [activeSection, setActiveSection] = useState("scripts");
  const [showTeleprompter, setShowTeleprompter] = useState(false);

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

  const handleStartTeleprompter = () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please add some text before starting the teleprompter",
        variant: "destructive",
      });
      return;
    }
    setShowTeleprompter(true);
  };

  const handleExitTeleprompter = () => {
    setShowTeleprompter(false);
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
        {/* Left Navigation Panel */}
        <div className="w-64 bg-white/50 backdrop-blur-sm border-r border-white/20 p-4">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveSection("scripts")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === "scripts" 
                  ? "bg-blue-100 text-blue-700 font-medium" 
                  : "text-gray-700 hover:bg-blue-50"
              }`}
            >
              <FileText className="h-5 w-5" />
              Scripts
            </button>
            
            <button 
              onClick={() => setActiveSection("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === "settings" 
                  ? "bg-blue-100 text-blue-700 font-medium" 
                  : "text-gray-700 hover:bg-blue-50"
              }`}
            >
              <Settings className="h-5 w-5" />
              Settings
            </button>

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
                onClick={() => setActiveSection("video-capture")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "video-capture" 
                    ? "bg-red-100 text-red-700 font-medium" 
                    : "text-gray-700 hover:bg-red-50"
                }`}
              >
                <Video className="h-5 w-5" />
                Video Capture
                <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700 text-xs">
                  Premium
                </Badge>
              </button>
              
              <button 
                onClick={() => setActiveSection("captions")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "captions" 
                    ? "bg-green-100 text-green-700 font-medium" 
                    : "text-gray-700 hover:bg-green-50"
                }`}
              >
                <Type className="h-5 w-5" />
                Captions
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

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Usage Progress (Free tier) */}
          {subscription?.tier === 'free' && (
            <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Free Plan Usage</span>
                  </div>
                  <span className="text-sm text-amber-700">
                    {subscription.usage || 0} / {subscription.usageLimit || 60} minutes
                  </span>
                </div>
                <Progress 
                  value={((subscription.usage || 0) / (subscription.usageLimit || 60)) * 100} 
                  className="mb-3"
                />
                <p className="text-xs text-amber-700">
                  Upgrade to Pro for unlimited usage or Premium for AI features
                </p>
              </CardContent>
            </Card>
          )}

          {/* Scripts Section */}
          {activeSection === "scripts" && (
            <div className="space-y-6">
              <Card className="max-w-4xl mx-auto">
                <CardContent>
                  <FileImport 
                    content={content} 
                    setContent={setContent} 
                    onStartTeleprompter={handleStartTeleprompter}
                  />
                  
                  <div className="mt-6 flex gap-3 justify-end">
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
                </CardContent>
              </Card>

              {/* AI Assistant under script editor */}
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold text-blue-700 mb-4">AI Script Assistant - get help in Writing new Scripts</h3>
                <AIScriptAssistant onScriptGenerated={handleScriptGenerated} />
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">Settings</h2>
                <p className="text-blue-600 mb-8">Configure your teleprompter preferences</p>
              </div>

              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Teleprompter Settings</CardTitle>
                  <CardDescription>
                    Customize font size, scroll speed, and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Settings panel will be displayed here with font size, scroll speed, text orientation, and other preferences.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Assistant Section */}
          {activeSection === "ai-assistant" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">AI Script Assistant</h2>
                <p className="text-blue-600 mb-8">Generate professional scripts for any occasion with AI</p>
              </div>
              <AIScriptAssistant onScriptGenerated={handleScriptGenerated} />
            </div>
          )}

          {/* Video Capture Section */}
          {activeSection === "video-capture" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">Video Capture</h2>
                <p className="text-blue-600 mb-8">Record yourself presenting with optional transparent background</p>
              </div>
              
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-600" />
                    Video Recording
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Record yourself presenting with optional transparent background
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowVideoRecorder(true)}
                    className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Open Video Recorder
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Captions Section */}
          {activeSection === "captions" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-700 mb-2">AI Captions</h2>
                <p className="text-blue-600 mb-8">Generate automatic captions for your presentations</p>
              </div>
              
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-green-600" />
                    AI Caption Generation
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Automatically generate captions and subtitles for your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">AI-powered caption generation feature coming soon for Premium subscribers.</p>
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
    </div>
  );
}