import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Listen for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates periodically
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available
                setShowPrompt(true);
              }
            });
          }
        });
      });

      // Listen for controller change (when skipWaiting is called)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell service worker to skip waiting and activate
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 shadow-lg animate-in slide-in-from-top">
      <div className="max-w-[420px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-white animate-spin" />
          <span className="text-white font-medium text-sm">Update available!</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleUpdate}
            className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 px-3 text-xs font-medium"
          >
            Update Now
          </Button>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
