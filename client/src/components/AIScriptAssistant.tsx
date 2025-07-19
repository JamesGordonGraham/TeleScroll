import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, Crown, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

interface ScriptGenerationForm {
  scriptType: string;
  topic: string;
  duration: number;
  tone: string;
  audience: string;
  keyPoints: string;
  additionalInstructions: string;
}

const scriptTypes = [
  { value: "news", label: "News Report" },
  { value: "presentation", label: "Business Presentation" },
  { value: "keynote", label: "Keynote Speech" },
  { value: "wedding", label: "Wedding Speech" },
  { value: "comedy", label: "Comedy Set" },
  { value: "business", label: "Business Address" },
  { value: "awards", label: "Awards Ceremony" },
];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "inspirational", label: "Inspirational" },
  { value: "humorous", label: "Humorous" },
];

const audiences = [
  { value: "general", label: "General Audience" },
  { value: "business", label: "Business Professionals" },
  { value: "academic", label: "Academic Audience" },
  { value: "family", label: "Family & Friends" },
  { value: "students", label: "Students" },
  { value: "executives", label: "Executives" },
];

interface AIScriptAssistantProps {
  onScriptGenerated: (script: string) => void;
}

export function AIScriptAssistant({ onScriptGenerated }: AIScriptAssistantProps) {
  const { toast } = useToast();
  const { canUseFeature, needsUpgrade } = useSubscription();
  
  const [form, setForm] = useState<ScriptGenerationForm>({
    scriptType: "",
    topic: "",
    duration: 5,
    tone: "professional",
    audience: "general",
    keyPoints: "",
    additionalInstructions: "",
  });

  const [improveForm, setImproveForm] = useState({
    content: "",
    instructions: "",
  });

  const generateScript = useMutation({
    mutationFn: async (data: ScriptGenerationForm) => {
      const keyPoints = data.keyPoints ? data.keyPoints.split(',').map(p => p.trim()).filter(Boolean) : [];
      const response = await apiRequest("POST", "/api/generate-script", {
        ...data,
        keyPoints,
      });
      return response.json();
    },
    onSuccess: (data) => {
      onScriptGenerated(data.script);
      toast({
        title: "Script Generated!",
        description: "Your AI-generated script has been added to the editor.",
      });
    },
    onError: (error: any) => {
      if (error.message.includes("upgrade")) {
        toast({
          title: "Premium Feature",
          description: "AI Script Assistant requires Premium subscription. Upgrade to access this feature!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const improveScript = useMutation({
    mutationFn: async (data: { content: string; instructions: string }) => {
      const response = await apiRequest("POST", "/api/improve-script", data);
      return response.json();
    },
    onSuccess: (data) => {
      onScriptGenerated(data.script);
      toast({
        title: "Script Improved!",
        description: "Your improved script has been updated in the editor.",
      });
      setImproveForm({ content: "", instructions: "" });
    },
    onError: (error: any) => {
      if (error.message.includes("upgrade")) {
        toast({
          title: "Premium Feature",
          description: "AI Script Assistant requires Premium subscription. Upgrade to access this feature!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Improvement Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scriptType || !form.topic) {
      toast({
        title: "Missing Information",
        description: "Please fill in the script type and topic.",
        variant: "destructive",
      });
      return;
    }
    generateScript.mutate(form);
  };

  const handleImprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!improveForm.content || !improveForm.instructions) {
      toast({
        title: "Missing Information",
        description: "Please provide both the script content and improvement instructions.",
        variant: "destructive",
      });
      return;
    }
    improveScript.mutate(improveForm);
  };

  const canUseAI = canUseFeature('ai_assistant');
  const needsUpgradeForAI = needsUpgrade('ai_assistant');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Script Assistant</h2>
          <p className="text-gray-600">Generate and improve professional scripts using AI</p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>

      {needsUpgradeForAI && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Premium Feature</h3>
                <p className="text-gray-600">Upgrade to Premium to access AI Script Assistant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Script Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Generate New Script
          </CardTitle>
          <CardDescription>
            Create professional scripts for various occasions using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scriptType">Script Type</Label>
                <Select value={form.scriptType} onValueChange={(value) => setForm({ ...form, scriptType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select script type" />
                  </SelectTrigger>
                  <SelectContent>
                    {scriptTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="30"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Quarterly Sales Results, Wedding of John and Jane"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select value={form.tone} onValueChange={(value) => setForm({ ...form, tone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="audience">Audience</Label>
                <Select value={form.audience} onValueChange={(value) => setForm({ ...form, audience: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="keyPoints">Key Points (comma-separated)</Label>
              <Input
                id="keyPoints"
                placeholder="e.g., Increased revenue, New partnerships, Future goals"
                value={form.keyPoints}
                onChange={(e) => setForm({ ...form, keyPoints: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="additionalInstructions">Additional Instructions (optional)</Label>
              <Textarea
                id="additionalInstructions"
                placeholder="Any specific requirements or style preferences..."
                value={form.additionalInstructions}
                onChange={(e) => setForm({ ...form, additionalInstructions: e.target.value })}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={!canUseAI || generateScript.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {generateScript.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Script
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Script Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Improve Existing Script
          </CardTitle>
          <CardDescription>
            Enhance your current script with AI-powered improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImprove} className="space-y-4">
            <div>
              <Label htmlFor="content">Current Script</Label>
              <Textarea
                id="content"
                placeholder="Paste your current script here..."
                value={improveForm.content}
                onChange={(e) => setImproveForm({ ...improveForm, content: e.target.value })}
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Improvement Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="e.g., Make it more engaging, Add humor, Shorten by 2 minutes, Make it more formal"
                value={improveForm.instructions}
                onChange={(e) => setImproveForm({ ...improveForm, instructions: e.target.value })}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={!canUseAI || improveScript.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {improveScript.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Improving Script...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve Script
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}