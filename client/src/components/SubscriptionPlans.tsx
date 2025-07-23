import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionPlan {
  name: string;
  price: string;
  priceId: string;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  popular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    name: "Free",
    price: "£0",
    priceId: "",
    description: "Perfect for getting started",
    features: [
      "1 hour total usage",
      "Basic teleprompter",
      "File import (.txt, .docx)",
      "Standard keyboard controls"
    ],
    icon: Star
  },
  {
    name: "Pro",
    price: "£1.99",
    priceId: "price_pro", // Replace with actual Stripe price ID
    description: "For regular speakers",
    popular: true,
    features: [
      "Unlimited usage",
      "Voice-to-text transcription",
      "Advanced teleprompter controls",
      "Priority support",
      "All file formats"
    ],
    icon: Zap
  },
  {
    name: "Premium",
    price: "£4.99",
    priceId: "price_premium", // Replace with actual Stripe price ID
    description: "For professionals",
    features: [
      "Everything in Pro",
      "AI Script Assistant",
      "Improve Existing Script",
      "Voice Input",
      "Script generation (news, speeches, etc.)",
      "Script improvement suggestions"
    ],
    icon: Crown
  }
];

function CheckoutForm({ priceId, onSuccess }: { priceId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess();
      toast({
        title: "Payment Successful",
        description: "Welcome to your new plan!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
      >
        {isProcessing ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
}

export function SubscriptionPlans() {
  const { subscription, createSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.priceId === "") return; // Free plan

    try {
      const response = await createSubscription.mutateAsync(plan.priceId);
      setClientSecret(response.clientSecret);
      setSelectedPlan(plan.priceId);
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setClientSecret(null);
  };

  if (clientSecret && selectedPlan) {
    const plan = plans.find(p => p.priceId === selectedPlan);
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {plan?.icon && React.createElement(plan.icon, { className: "h-5 w-5" })}
              Subscribe to {plan?.name}
            </CardTitle>
            <CardDescription>
              Complete your subscription for {plan?.price}/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm priceId={selectedPlan} onSuccess={handlePaymentSuccess} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isCurrentPlan = subscription?.tier === plan.name.toLowerCase();

        return (
          <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-800">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-blue-200">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                {plan.price}
                {plan.price !== "£0" && <span className="text-sm font-normal text-gray-500">/month</span>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              {isCurrentPlan ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={createSubscription.isPending}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.priceId === "" ? "Current Plan" : "Upgrade Now"}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}