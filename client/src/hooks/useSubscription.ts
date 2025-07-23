import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface SubscriptionStatus {
  tier: string;
  status: string;
  usage?: number;
  usageLimit?: number;
}

export function useSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription-status"],
    retry: false,
  });

  const createSubscription = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-status"] });
      toast({
        title: "Subscription Created",
        description: "Your subscription has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    subscription,
    isLoading,
    createSubscription,
    canUseFeature: (feature: string) => {
      if (!subscription) return false;
      
      if (subscription.tier === 'premium') return true;
      if (subscription.tier === 'pro' && feature === 'voice_input') return true;
      if (subscription.tier === 'free') {
        // Free users can try all features during their 60-minute grace period
        return (subscription.usage || 0) < (subscription.usageLimit || 60);
      }
      
      return false;
    },
    needsUpgrade: (feature: string) => {
      if (!subscription) return true;
      
      // Free users who have exceeded their trial time need to upgrade
      if (subscription.tier === 'free' && (subscription.usage || 0) >= (subscription.usageLimit || 60)) return true;
      
      // Pro users need Premium for AI features
      if (feature === 'ai_assistant' && subscription.tier !== 'premium') return true;
      
      return false;
    },
    isTrialExpired: () => {
      if (!subscription) return false;
      return subscription.tier === 'free' && (subscription.usage || 0) >= (subscription.usageLimit || 60);
    }
  };
}