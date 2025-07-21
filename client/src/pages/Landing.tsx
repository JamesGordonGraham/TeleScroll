import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Video, 
  Sparkles, 
  Crown, 
  Zap,
  Star,
  Check,
  Mic,
  Settings,
  Play,
  Users
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import logo from "@assets/Vibe Prompting teleprompter autocue logo_1753095967610.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const features = [
    {
      icon: FileText,
      title: "Professional Teleprompter",
      description: "Smooth scrolling with customizable speed, font size, and display options"
    },
    {
      icon: Mic,
      title: "Voice-to-Text Input",
      description: "Real-time speech transcription with Google's advanced AI"
    },
    {
      icon: Sparkles,
      title: "AI Script Assistant",
      description: "Generate and improve scripts for any occasion using GPT-4"
    },
    {
      icon: Video,
      title: "Video Recording",
      description: "Record presentations with transparent background support"
    },
    {
      icon: Settings,
      title: "Advanced Controls",
      description: "Bluetooth keyboard shortcuts and marker navigation"
    },
    {
      icon: Users,
      title: "Multiple Script Types",
      description: "News, presentations, weddings, business, and more"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "£0",
      description: "Perfect for getting started",
      features: [
        "1 hour total usage",
        "Basic teleprompter",
        "File import (.txt, .docx)",
        "Standard keyboard controls"
      ],
      icon: Star,
      popular: false
    },
    {
      name: "Pro",
      price: "£1.99",
      description: "For regular speakers",
      features: [
        "Unlimited usage",
        "Voice-to-text transcription", 
        "Advanced teleprompter controls",
        "Priority support",
        "All file formats"
      ],
      icon: Zap,
      popular: true
    },
    {
      name: "Premium",
      price: "£4.99", 
      description: "For professionals",
      features: [
        "Everything in Pro",
        "AI Script Assistant",
        "Video recording with transparent background",
        "AI-generated captions",
        "Script generation for any occasion",
        "Script improvement suggestions"
      ],
      icon: Crown,
      popular: false
    }
  ];

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
          <div className="flex gap-3">
            <Button 
              onClick={handleGoogleLogin} 
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            >
              <SiGoogle className="h-4 w-4 text-red-500" />
              Google
            </Button>
            <Button onClick={handleLogin} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Teleprompter with
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> AI Power</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create, improve, and present scripts with our advanced teleprompter featuring AI assistance, 
            voice input, and professional video recording capabilities.
          </p>
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={handleGoogleLogin}
                size="lg" 
                variant="outline"
                className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
              >
                <SiGoogle className="h-5 w-5 text-red-500" />
                Continue with Google
              </Button>
              <div className="text-gray-400 text-sm">or</div>
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Play className="h-5 w-5 mr-2" />
                Get Started Free
              </Button>
            </div>
            <p className="text-gray-600">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From basic teleprompter functionality to advanced AI-powered script generation and video recording
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you need more features. All plans include core teleprompter functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">
                    {plan.price}
                    {plan.price !== "£0" && <span className="text-sm font-normal text-gray-500">/month</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={handleLogin}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <CardContent className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Presentations?</h3>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of speakers, content creators, and professionals using our teleprompter platform
            </p>
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Start Your Free Trial
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <span>© 2025 Teleprompter / Autocue. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}