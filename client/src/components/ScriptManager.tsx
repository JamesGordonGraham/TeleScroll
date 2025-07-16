import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, FolderOpen, Trash2, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Script } from '@shared/schema';

interface ScriptManagerProps {
  content: string;
  onLoadScript: (content: string) => void;
}

export function ScriptManager({ content, onLoadScript }: ScriptManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scripts
  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['/api/scripts'],
    enabled: isDialogOpen,
  });

  // Save script mutation
  const saveScriptMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiRequest('POST', '/api/scripts', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scripts'] });
      setIsSaveDialogOpen(false);
      setSaveTitle('');
      toast({
        title: "Script saved",
        description: "Your script has been saved successfully",
      });
    },
    onError: (error: any) => {
      console.error('Save script error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save script",
        variant: "destructive",
      });
    },
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/scripts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scripts'] });
      toast({
        title: "Script deleted",
        description: "Script has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete script",
        variant: "destructive",
      });
    },
  });

  const handleSaveScript = () => {
    if (!saveTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your script",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "No content",
        description: "Cannot save an empty script",
        variant: "destructive",
      });
      return;
    }

    console.log('Saving script:', { title: saveTitle.trim(), content: content.substring(0, 50) + '...' });
    saveScriptMutation.mutate({
      title: saveTitle.trim(),
      content: content,
    });
  };

  const handleLoadScript = (script: Script) => {
    onLoadScript(script.content);
    setIsDialogOpen(false);
    toast({
      title: "Script loaded",
      description: `Loaded "${script.title}"`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex gap-2">
      {/* Save Script Button */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            disabled={!content.trim()}
          >
            <Save className="w-4 h-4" />
            Save Script
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Script</DialogTitle>
            <DialogDescription>
              Enter a title for your script to save it to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Script Title
              </label>
              <Input
                id="title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Enter a title for your script..."
                maxLength={100}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveScript}
                disabled={saveScriptMutation.isPending || !saveTitle.trim()}
              >
                {saveScriptMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Scripts Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Load Script
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Saved Scripts</DialogTitle>
            <DialogDescription>
              Select a script to load into the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading scripts...</div>
              </div>
            ) : scripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <div className="text-muted-foreground">No saved scripts found</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Save your first script to see it here
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {scripts.map((script: Script) => (
                  <Card key={script.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-medium line-clamp-1">
                          {script.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScriptMutation.mutate(script.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Modified: {formatDate(script.updatedAt)}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {script.content.length} chars
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="pt-0"
                      onClick={() => handleLoadScript(script)}
                    >
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {getPreview(script.content, 200)}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadScript(script);
                        }}
                      >
                        Load Script
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}