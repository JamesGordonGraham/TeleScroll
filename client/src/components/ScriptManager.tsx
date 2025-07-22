import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, FileText, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

declare global {
  function confirm(message?: string): boolean;
}

interface Script {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ScriptManagerProps {
  onLoadScript: (content: string) => void;
}

export default function ScriptManager({ onLoadScript }: ScriptManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved scripts
  const { data: scripts = [], isLoading } = useQuery<Script[]>({
    queryKey: ["/api/scripts"],
    retry: false,
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

  const getPreview = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-600">Loading your scripts...</span>
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts yet</h3>
          <p className="text-gray-500">
            Create your first script in the editor below and save it to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Saved Scripts ({scripts.length})
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scripts.map((script: Script) => (
          <Card key={script.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-medium line-clamp-1">
                  {script.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteScript(script.id, script.title)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                  disabled={deleteScriptMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(script.createdAt)}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {getPreview(script.content)}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {script.content.length} chars
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadScript(script)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Load
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}