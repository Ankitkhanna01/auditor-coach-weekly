import { useEffect, useState } from "react";

export const PWAUpdatePrompt = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let updateCheckCount = 0;
    const maxInitialChecks = 3;

    // Force check for updates
    const checkForUpdates = async (showLoading = false) => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Check if there's already a waiting service worker
          if (registration.waiting) {
            if (showLoading) setIsUpdating(true);
            // Tell it to activate immediately
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            return;
          }
          
          // Check for new updates
          await registration.update();
          
          // If update found and waiting
          if (registration.waiting) {
            if (showLoading) setIsUpdating(true);
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        } catch (error) {
          console.log("SW update check failed:", error);
        }
      }
    };

    // Check on visibility change (when user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates(true);
      }
    };

    // Check on focus
    const handleFocus = () => {
      checkForUpdates(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Initial aggressive checks - check multiple times on app start
    const doInitialChecks = async () => {
      for (let i = 0; i < maxInitialChecks; i++) {
        await checkForUpdates(i === 0);
        updateCheckCount++;
        // Wait a bit between checks
        if (i < maxInitialChecks - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
    
    doInitialChecks();

    // Listen for controller change and reload automatically
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // New service worker has taken control - reload to get latest version
        window.location.reload();
      });

      // Also listen for state changes on installing workers
      navigator.serviceWorker.ready.then(registration => {
        if (registration.installing) {
          trackInstalling(registration.installing);
        }
        
        registration.addEventListener("updatefound", () => {
          if (registration.installing) {
            trackInstalling(registration.installing);
          }
        });
      });
    }

    function trackInstalling(worker: ServiceWorker) {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          // New version installed, skip waiting
          setIsUpdating(true);
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Show brief loading overlay when updating
  if (isUpdating) {
    return (
      <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Updating...</p>
      </div>
    );
  }

  return null;
};
