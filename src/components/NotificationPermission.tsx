import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNotifications } from "@/hooks/useNotifications";
import { useBills } from "@/hooks/useBills";

export function NotificationPermission() {
  const { bills } = useBills();
  const { permission, requestPermission } = useNotifications(bills);
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if user has already dismissed this prompt
  useEffect(() => {
    const wasDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  // Don't show if already granted, denied, or dismissed
  if (permission === "granted" || permission === "denied" || dismissed) {
    return null;
  }

  // Don't show if notifications aren't supported
  if (!("Notification" in window)) {
    return null;
  }

  const handleEnable = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  return (
    <GlassCard className="p-4 border-primary/30 bg-primary/5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 rounded-full bg-primary/20 shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-semibold text-sm">Enable Notifications</p>
            <p className="text-xs text-muted-foreground">
              Get reminded 5, 2, and 1 business day before bills are due
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isRequesting}
            className="bg-gradient-to-r from-violet-500 to-cyan-500 text-xs h-8"
          >
            {isRequesting ? "Enabling..." : "Enable Notifications"}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
