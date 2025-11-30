import { useState, useEffect } from "react";
import { Bell, Check, Smartphone, Clock, Zap, Star, Users, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const benefits = [
  "Track credit cards, utilities & subscriptions",
  "Get reminded 5, 2 & 1 day before due",
  "Never pay a late fee again",
  "Add bills through simple chat",
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Freelancer",
    text: "Saved me $200 in late fees in just 2 months! The reminders are perfectly timed.",
    rating: 5,
  },
  {
    name: "Mike R.",
    role: "Small Business Owner",
    text: "Finally stopped missing my credit card payments. Simple and just works.",
    rating: 5,
  },
  {
    name: "Jessica L.",
    role: "Working Mom",
    text: "With 6 different bills, this app is a lifesaver. Highly recommend!",
    rating: 5,
  },
];

const Landing = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usersToday, setUsersToday] = useState(47);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    
    // Simulate live user counter for urgency
    const interval = setInterval(() => {
      setUsersToday(prev => prev + Math.floor(Math.random() * 2));
    }, 30000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      alert("Tap the browser menu (⋮) and select 'Add to Home Screen' or 'Install App'");
      return;
    }

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowSuccess(true);
      }
    } catch (e) {
      console.error("Install error:", e);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-violet-600/20 via-cyan-500/10 to-transparent blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 app-container pb-32">
        {/* Limited Time Free Banner - Urgency */}
        <div className="bg-gradient-to-r from-warning/20 via-destructive/10 to-warning/20 border-b border-warning/30 py-2.5 px-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
            <span className="text-foreground">
              <span className="font-bold text-warning">FREE for life</span> — early adopter pricing ends soon
            </span>
          </div>
        </div>
        
        {/* Live Users Counter */}
        <div className="bg-muted/30 py-1.5 px-4 border-b border-border/30">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
            </span>
            <span>{usersToday} people installed today</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-10 pb-6 text-center">
          {/* Icon with pulse animation */}
          <div className="relative inline-flex mb-5">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 p-4">
              <Bell className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center animate-pulse">
              <span className="text-xs font-bold text-white">!</span>
            </div>
          </div>

          {/* Pain Point Headline */}
          <h1 className="text-3xl font-bold text-foreground mb-2 leading-tight">
            Tired of <span className="text-destructive">Late Fees</span>?
          </h1>
          
          {/* Value Proposition */}
          <p className="text-base text-muted-foreground mb-1">
            Stop forgetting bill due dates.
          </p>
          <p className="text-lg font-semibold gradient-text">
            Get reminded before it costs you.
          </p>
        </div>

        {/* App Preview - Phone Mockup */}
        <div className="px-6 py-4">
          <div className="relative mx-auto max-w-[240px]">
            {/* Phone Frame */}
            <div className="relative rounded-[2rem] border-4 border-muted bg-card p-2 shadow-2xl shadow-black/20">
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-muted rounded-full z-10" />
              
              {/* Screen Content */}
              <div className="rounded-[1.5rem] bg-background overflow-hidden aspect-[9/16] relative">
                {/* Mini Dashboard Preview */}
                <div className="p-3 pt-8">
                  <div className="text-xs text-muted-foreground mb-1">Upcoming Bills</div>
                  
                  {/* Bill Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                          <Bell className="w-3 h-3 text-destructive" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium">Credit Card</p>
                          <p className="text-[8px] text-destructive">Due Tomorrow</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold">$450</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-warning" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium">Electric Bill</p>
                          <p className="text-[8px] text-warning">Due in 3 days</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold">$120</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <Check className="w-3 h-3 text-success" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium">Netflix</p>
                          <p className="text-[8px] text-muted-foreground">Due in 12 days</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold">$15</p>
                    </div>
                  </div>
                  
                  {/* Stats Bar */}
                  <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
                    <div className="flex justify-between text-center">
                      <div>
                        <p className="text-[10px] font-bold text-violet-400">$585</p>
                        <p className="text-[7px] text-muted-foreground">This month</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-success">$0</p>
                        <p className="text-[7px] text-muted-foreground">Late fees</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-cyan-400">6</p>
                        <p className="text-[7px] text-muted-foreground">Bills tracked</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -right-2 top-20 bg-success text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
              Live Preview
            </div>
          </div>
        </div>

        {/* Stats/Trust Section */}
        <div className="px-6 py-4">
          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-bold gradient-text">$150+</p>
              <p className="text-[10px] text-muted-foreground">Avg saved/year</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-xl font-bold gradient-text">10K+</p>
              <p className="text-[10px] text-muted-foreground">Active users</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-xl font-bold gradient-text">4.9★</p>
              <p className="text-[10px] text-muted-foreground">User rating</p>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <p className="text-sm text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="px-6 py-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center">How it works</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 text-center">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-xs text-muted-foreground">Install app</p>
              </div>
              <Zap className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 text-center">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-xs text-muted-foreground">Add due dates</p>
              </div>
              <Zap className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 text-center">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Get reminded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center">What users say</p>
          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl bg-card border border-border/50 slide-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{testimonial.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{testimonial.name}</span>
                      <span className="text-xs text-muted-foreground">• {testimonial.role}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{`"${testimonial.text}"`}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="px-6 py-4">
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-success" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-4 h-4 text-violet-400" />
              <span>10K+ Users</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>$1.5M Saved</span>
            </div>
          </div>
        </div>

        {/* iOS Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-end animate-in fade-in">
            <div className="bg-card rounded-t-3xl p-6 w-full max-h-[85vh] overflow-y-auto">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-center mb-2">Install on iPhone</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">Follow these quick steps:</p>
              
              <div className="space-y-5">
                {[
                  { step: "1", title: "Tap Share", desc: "The square with arrow at the bottom" },
                  { step: "2", title: "Add to Home Screen", desc: "Scroll down in the menu" },
                  { step: "3", title: "Tap Add", desc: "Top right corner" },
                  { step: "4", title: "Open from home screen", desc: "Create account & start!" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-8 h-12 bg-gradient-to-r from-violet-500 to-cyan-500"
              >
                Got it!
              </Button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              
              <h2 className="text-xl font-bold mb-2">You are All Set!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Open <span className="font-semibold text-foreground">NeverLate</span> from your home screen to get started.
              </p>

              <Button
                onClick={() => setShowSuccess(false)}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-cyan-500"
              >
                Got it!
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-20">
        {/* Early Adopter Badge */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/20 border border-warning/30">
            <span className="text-warning text-xs">🎁</span>
            <span className="text-xs font-medium text-warning">Early adopters get lifetime free access</span>
          </div>
        </div>
        
        {/* Urgency Text */}
        <p className="text-center text-xs text-muted-foreground mb-2">
          <span className="text-destructive font-semibold">⏰ Offer closing soon</span> — We will start charging new users
        </p>
        
        <Button
          onClick={handleInstall}
          disabled={isInstalling}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-500 to-cyan-500 hover:opacity-90 rounded-2xl shadow-xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isInstalling ? (
            "Installing..."
          ) : (
            <>
              <Smartphone className="w-5 h-5 mr-2" />
              Install Free — Lock Lifetime Access
            </>
          )}
        </Button>
        
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-success" /> No credit card
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-success" /> No app store
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-success" /> Cancel anytime
          </span>
        </div>
      </div>
    </div>
  );
};

export default Landing;