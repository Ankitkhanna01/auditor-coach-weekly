import { useEffect, useRef, useState } from "react";

export const PWAUpdatePrompt = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const reloadedRef = useRef(false);
  const overlayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let lastCheck = 0;

    // Never let the overlay stick around; it must be a brief transition only.
    const showOverlayBriefly = () => {
      if (cancelled) return;
      setIsUpdating(true);
      if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = window.setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    };

    const activateWaiting = (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting) return;
      showOverlayBriefly();
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    };

    const checkForUpdates = async () => {
      // Throttle: at most one real check every 30s
      const now = Date.now();
      if (now - lastCheck < 30000) return;
      lastCheck = now;

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration || cancelled) return;

        if (registration.waiting) {
          activateWaiting(registration);
          return;
        }

        await registration.update();
        if (cancelled) return;
        if (registration.waiting) activateWaiting(registration);
      } catch (error) {
        console.log("SW update check failed:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Reload only when an *existing* controller is replaced by a new version.
    // On first install there is no previous controller, so no reload is needed.
    const handleControllerChange = () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      window.location.reload();
    };

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    }

    // Single check shortly after startup, so first paint is never blocked.
    const startTimer = window.setTimeout(checkForUpdates, 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!isUpdating) return null;

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex items-center justify-center flex-col gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Updating...</p>
    </div>
  );
};
