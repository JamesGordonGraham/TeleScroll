import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Calendar, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Script {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedScriptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScript: (content: string) => void;
}

export default function SavedScriptsModal({ isOpen, onClose, onLoadScript }: SavedScriptsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved scripts
  const { data: scripts = [], isLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
    retry: false,
    enabled: isOpen, // Only fetch when modal is open
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      await apiRequest("DELETE", `/api/scripts/${scriptId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scripts"] });
      toast({
        title: "Script deleted",
        description: "The script has been removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLoadScript = (script: Script) => {
    onLoadScript(script.content);
    onClose(); // Close modal after loading
    toast({
      title: "Script loaded",
      description: `"${script.title}" has been loaded into the editor`,
    });
  };

  const handleDeleteScript = async (scriptId: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteScriptMutation.mutate(scriptId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Your Saved Scripts ({scripts.length})
          </DialogTitle>
          <DialogDescription>
            Select a script to load into the editor, or delete scripts you no longer need.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-600">Loading your scripts...</span>
            </div>
          ) : scripts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts yet</h3>
              <p className="text-gray-500">
                Create your first script in the editor and save it to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scripts.map((script: Script) => (
                <div key={script.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {script.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(script.createdAt)}
                          </div>
                          <span>{script.content.length} characters</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {getPreview(script.content, 120)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => handleLoadScript(script)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScript(script.id, script.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteScriptMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}