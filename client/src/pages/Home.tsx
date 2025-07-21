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
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { FileImport } from "@/components/FileImport";
import { AIScriptAssistant } from "@/components/AIScriptAssistant";
import { VideoRecorder } from "@/components/VideoRecorder";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/Vibe prompting logo v1 18 jul 2025_1753096193955.png";

interface HomeProps {
  content: string;
  setContent: (content: string) => void;
  onStartTeleprompter: () => void;
}

export default function Home({ content, setContent, onStartTeleprompter }: HomeProps) {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [activeTab, setActiveTab] = useState("script");

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleScriptGenerated = (script: string) => {
    setContent(script);
    setActiveTab("script");
    toast({
      title: "Script Generated",
      description: "Your AI-generated script is ready in the editor!",
    });
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
      <header className="container mx-auto px-4 py-6">
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

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="script" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Script Editor
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Assistant
                  <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">
                    Premium
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Recording
                  <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">
                    Premium
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="upgrade">
                  <Crown className="h-4 w-4" />
                  Upgrade
                </TabsTrigger>
              </TabsList>

              <TabsContent value="script" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Script Editor</CardTitle>
                    <CardDescription>
                      Import your script or use voice input to create content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileImport content={content} setContent={setContent} />
                  </CardContent>
                </Card>

                {content && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ready to Present</CardTitle>
                      <CardDescription>
                        Your script is loaded and ready for the teleprompter
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={onStartTeleprompter}
                        size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        Start Teleprompter
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="ai">
                <AIScriptAssistant onScriptGenerated={handleScriptGenerated} />
              </TabsContent>

              <TabsContent value="video">
                <Card>
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
              </TabsContent>

              <TabsContent value="upgrade">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Your Plan</h3>
                    <p className="text-gray-600">Unlock powerful features with Pro or Premium</p>
                  </div>
                  <SubscriptionPlans />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {content && (
                  <Button 
                    onClick={onStartTeleprompter}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Start Teleprompter
                  </Button>
                )}
                
                <Button 
                  onClick={() => setShowVideoRecorder(true)}
                  variant="outline"
                  className="w-full"
                  disabled={!subscription || subscription.tier !== 'premium'}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Record Video
                  {subscription?.tier !== 'premium' && (
                    <Crown className="h-3 w-3 ml-2 text-purple-600" />
                  )}
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("ai")}
                  variant="outline"
                  className="w-full"
                  disabled={!subscription || subscription.tier !== 'premium'}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Assistant
                  {subscription?.tier !== 'premium' && (
                    <Crown className="h-3 w-3 ml-2 text-purple-600" />
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <Badge 
                    variant="secondary" 
                    className={`bg-gradient-to-r ${getTierColor(subscription?.tier || 'free')} text-white border-none`}
                  >
                    {React.createElement(getTierIcon(subscription?.tier || 'free'), { className: "h-3 w-3 mr-1" })}
                    {(subscription?.tier || 'free').charAt(0).toUpperCase() + (subscription?.tier || 'free').slice(1)}
                  </Badge>
                </div>
                
                {subscription?.tier === 'free' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usage</span>
                    <span className="text-sm text-gray-900">
                      {subscription.usage || 0}/{subscription.usageLimit || 60}min
                    </span>
                  </div>
                )}
                
                <Button 
                  onClick={() => setActiveTab("upgrade")}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• Use keyboard shortcuts in the teleprompter for hands-free control</p>
                <p>• Voice input works best in quiet environments</p>
                <p>• AI Assistant can create scripts for any occasion</p>
                <p>• Video recording captures only you, not the text</p>
              </CardContent>
            </Card>
          </div>
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