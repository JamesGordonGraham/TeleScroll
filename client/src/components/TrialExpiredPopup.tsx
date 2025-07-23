import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Clock, X } from "lucide-react";

interface TrialExpiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'pro' | 'premium') => void;
}

export default function TrialExpiredPopup({ isOpen, onClose, onUpgrade }: TrialExpiredPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full mx-auto shadow-2xl">
        <CardHeader className="text-center relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            🎉 Your 60-Minute Trial is Complete!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            You've experienced all our premium features. Ready to continue?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pro Plan */}
            <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-blue-200">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-900">Pro Plan</CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  £1.99<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span>Unlimited teleprompter usage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span>Voice-to-text transcription</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span>Advanced teleprompter controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => onUpgrade('pro')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  Choose Pro
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors relative">
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-purple-200">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-purple-900">Premium Plan</CardTitle>
                <div className="text-3xl font-bold text-purple-600">
                  £4.99<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span>AI Script Assistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span>Improve Existing Script</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span>Voice Input</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span>Script generation & improvements</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => onUpgrade('premium')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Choose Premium
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="text-gray-600"
            >
              Continue with Free Plan (Limited)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}