import { useState, useEffect } from "react";
import { Bell, Check, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Landing = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Check if running in iframe (Lovable preview)
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("Install prompt ready!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    
    // Also listen for appinstalled event
    window.addEventListener("appinstalled", () => {
      setShowSuccess(true);
      setDeferredPrompt(null);
    });
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    // If in iframe, prompt user to open in browser
    if (isInIframe) {
      window.open(window.location.href, '_blank');
      return;
    }
    
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // If native prompt is available, use it directly
    if (deferredPrompt) {
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
      return;
    }

    // Fallback: show Android instructions modal
    setShowAndroidInstructions(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Install Banner - Shows when install is ready */}
      {deferredPrompt && !isInIframe && (
        <div 
          onClick={handleInstall}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 flex items-center justify-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Smartphone className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">Tap here to install NeverLate</span>
        </div>
      )}

      {/* Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-violet-600/15 via-cyan-500/5 to-transparent blur-[80px]" />
      </div>

      <div className={`flex-1 flex flex-col relative z-10 app-container ${deferredPrompt && !isInIframe ? 'pt-12' : ''}`}>
        
        {/* Hero Section - Clean & Focused */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 text-center">
          
          {/* App Icon */}
          <div className="relative inline-flex mx-auto mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/25">
              <Bell className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">!</span>
            </div>
          </div>

          {/* Single Clear Headline */}
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            Never Miss a<br />
            <span className="gradient-text">Bill Payment</span>
          </h1>
          
          {/* One-line Value Prop */}
          <p className="text-lg text-muted-foreground mb-8 max-w-xs mx-auto">
            Smart reminders before every due date. No more late fees.
          </p>

          {/* Social Proof - Simple */}
          <div className="flex items-center justify-center gap-1 mb-8">
            <div className="flex -space-x-2">
              {['S', 'M', 'J'].map((initial, i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center border-2 border-background text-xs font-bold text-white"
                >
                  {initial}
                </div>
              ))}
            </div>
            <div className="ml-3 text-left">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Join 500+ early adopters</p>
            </div>
          </div>

          {/* 3 Key Benefits - Concise */}
          <div className="space-y-3 mb-10 max-w-xs mx-auto">
            {[
              "Reminds you 3 days before",
              "Track all bills in one place",
              "Takes 30 seconds to set up"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <p className="text-sm text-foreground text-left">{benefit}</p>
              </div>
            ))}
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

        {/* Android Instructions Modal */}
        {showAndroidInstructions && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-end animate-in fade-in">
            <div className="bg-card rounded-t-3xl p-6 w-full max-h-[85vh] overflow-y-auto">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-center mb-2">Install on Android</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">Follow these quick steps:</p>
              
              <div className="space-y-5">
                {[
                  { step: "1", title: "Tap Menu", desc: "The ⋮ icon in top right corner" },
                  { step: "2", title: "Install App", desc: "Or 'Add to Home Screen'" },
                  { step: "3", title: "Tap Install", desc: "Confirm the installation" },
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
                onClick={() => setShowAndroidInstructions(false)}
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

      {/* CTA Section - Fixed at bottom, Clean */}
      <div className="sticky bottom-0 z-40 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        {/* Urgency - Single line */}
        <p className="text-center text-sm text-muted-foreground mb-3">
          <span className="text-warning font-medium">Free for early adopters</span> — limited time
        </p>
        
        <Button
          onClick={handleInstall}
          disabled={isInstalling}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-500 to-cyan-500 hover:opacity-90 rounded-2xl shadow-xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isInstalling ? (
            "Installing..."
          ) : isInIframe ? (
            <>
              <Smartphone className="w-5 h-5 mr-2" />
              Open in Browser to Install
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5 mr-2" />
              Get Started Free
            </>
          )}
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-3">
          {isInIframe ? "Open in browser for direct install" : "No app store needed · Works offline · 30 sec setup"}
        </p>
      </div>
    </div>
  );
};

export default Landing;