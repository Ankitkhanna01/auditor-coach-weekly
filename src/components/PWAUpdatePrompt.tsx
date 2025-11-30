import { useEffect } from "react";

export const PWAUpdatePrompt = () => {
  useEffect(() => {
    // Force check for updates on app focus/visibility
    const checkForUpdates = async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      }
    };

    // Check on visibility change (when user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    // Check on focus
    const handleFocus = () => {
      checkForUpdates();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Initial check
    checkForUpdates();

    // Listen for controller change and reload automatically
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // No UI needed - updates happen automatically
  return null;
};
