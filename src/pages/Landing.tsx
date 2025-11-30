import { useState, useEffect } from "react";
import { Bell, Check, Smartphone, AlertCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const Landing = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
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

      <div className="flex-1 flex flex-col relative z-10 app-container">
        {/* Hero Section */}
        <div className="px-6 pt-16 pb-8 text-center">
          {/* Icon with pulse animation */}
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <Bell className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center animate-pulse">
              <span className="text-xs font-bold text-white">!</span>
            </div>
          </div>

          {/* Pain Point Headline */}
          <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Tired of <span className="text-destructive">Late Fees</span>?
          </h1>
          
          {/* Value Proposition */}
          <p className="text-lg text-muted-foreground mb-2">
            Stop forgetting bill due dates.
          </p>
          <p className="text-xl font-semibold gradient-text">
            Get reminded before it's too late.
          </p>
        </div>

        {/* Stats/Trust Section */}
        <div className="px-6 py-4">
          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold gradient-text">$150+</p>
              <p className="text-xs text-muted-foreground">Avg saved/year</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-bold gradient-text">3x</p>
              <p className="text-xs text-muted-foreground">Reminders per bill</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-bold gradient-text">30s</p>
              <p className="text-xs text-muted-foreground">To add a bill</p>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="px-6 py-6 flex-1">
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <p className="text-foreground font-medium">{benefit}</p>
              </div>
            ))}
          </div>

          {/* How It Works - Simple */}
          <div className="mt-8 p-4 rounded-2xl bg-muted/30 border border-border/50">
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
              
              <h2 className="text-xl font-bold mb-2">You're All Set!</h2>
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
      <div className="sticky bottom-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12">
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
              Install Free App
            </>
          )}
        </Button>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-success" /> Free forever
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-success" /> No app store
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-success" /> Works offline
          </span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
