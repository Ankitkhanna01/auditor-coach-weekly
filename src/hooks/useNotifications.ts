import { useEffect, useState, useCallback } from "react";
import { Bill, getDaysUntilDue } from "./useBills";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const NOTIFICATION_STORAGE_KEY = "bill-notifications-sent";

// Calculate business days until due (excluding weekends)
function getBusinessDaysUntilDue(nextDueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  let businessDays = 0;
  const currentDate = new Date(today);
  
  while (currentDate < dueDate) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    // Count only weekdays (Mon-Fri)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }
  
  return businessDays;
}

// Get notification key for a bill at a specific reminder threshold
function getNotificationKey(billId: string, threshold: number, month: number, year: number): string {
  return `${billId}-${threshold}-${month}-${year}`;
}

// Load sent notifications from storage
function getSentNotifications(): Set<string> {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error("Failed to load notifications:", e);
  }
  return new Set();
}

// Save sent notifications to storage
function saveSentNotifications(sent: Set<string>): void {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify([...sent]));
}

// Check if bill notifications should be shown (respects paid/snoozed status)
function shouldNotify(bill: Bill): boolean {
  // Don't notify if already paid
  if (bill.is_paid) return false;
  
  // Don't notify if snoozed and snooze hasn't expired
  if (bill.snoozed_until) {
    const snoozeEnd = new Date(bill.snoozed_until);
    if (new Date() < snoozeEnd) return false;
  }
  
  return true;
}

// Helper function
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function useNotifications(bills: Bill[]) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [sentNotifications, setSentNotifications] = useState<Set<string>>(new Set());
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Load sent notifications on mount
  useEffect(() => {
    setSentNotifications(getSentNotifications());
    
    // Check current permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Subscribe to push notifications when permission is granted
  const subscribeToPush = useCallback(async () => {
    if (!user?.id || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }

      if (subscription) {
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        if (p256dh && auth) {
          await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              endpoint: subscription.endpoint,
              p256dh: arrayBufferToBase64(p256dh),
              auth: arrayBufferToBase64(auth),
            }, {
              onConflict: 'user_id,endpoint',
            });

          setPushSubscribed(true);
          console.log('Push subscription saved');
        }
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  }, [user?.id]);

  // Auto-subscribe when permission is granted
  useEffect(() => {
    if (permission === "granted" && user?.id && !pushSubscribed) {
      subscribeToPush();
    }
  }, [permission, user?.id, pushSubscribed, subscribeToPush]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }

    if (Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    }

    return false;
  }, []);

  // Play alarm sound
  const playAlarmSound = useCallback(() => {
    try {
      const audio = new Audio("/alarm-sound.mp3");
      audio.volume = 0.8;
      audio.loop = false;
      audio.play().catch(e => console.log("Audio play failed:", e));
      
      // Vibrate if supported (pattern: vibrate 500ms, pause 200ms, repeat 3x)
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
      }
    } catch (e) {
      console.error("Failed to play alarm:", e);
    }
  }, []);

  // Send a notification
  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permission !== "granted") return;

    try {
      // Play alarm sound and vibrate
      playAlarmSound();
      
      // Try service worker notification first (works when app is in background)
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: icon || "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            tag: title, // Prevents duplicate notifications
            requireInteraction: true,
            vibrate: [500, 200, 500, 200, 500],
          } as NotificationOptions);
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          body,
          icon: icon || "/pwa-192x192.png",
        });
      }
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  }, [permission, playAlarmSound]);

  // Check and send notifications for bills
  const checkBillNotifications = useCallback(() => {
    if (permission !== "granted" || bills.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thresholds = [5, 2, 1]; // Business days before due
    const newSent = new Set(sentNotifications);
    let hasChanges = false;

    bills.forEach((bill) => {
      // Skip if bill is paid or snoozed
      if (!shouldNotify(bill)) return;
      
      const businessDays = getBusinessDaysUntilDue(bill.next_due_date);
      const calendarDays = getDaysUntilDue(bill.next_due_date);
      
      thresholds.forEach((threshold) => {
        const key = getNotificationKey(bill.id, threshold, currentMonth, currentYear);
        
        // Check if we should send this notification
        if (businessDays <= threshold && !newSent.has(key)) {
          let urgencyText = "";
          let emoji = "📅";
          
          if (threshold === 1) {
            urgencyText = "Tomorrow";
            emoji = "🚨";
          } else if (threshold === 2) {
            urgencyText = "In 2 business days";
            emoji = "⚠️";
          } else {
            urgencyText = "In 5 business days";
            emoji = "📋";
          }

          const billName = bill.last_four_digits 
            ? `${bill.name} (••••${bill.last_four_digits})`
            : bill.name;
          
          const dueDate = new Date(bill.next_due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          sendNotification(
            `${emoji} Bill Due ${urgencyText}`,
            `${billName} is due on ${dueDate}${bill.amount ? ` - ~$${bill.amount}` : ''}`
          );

          newSent.add(key);
          hasChanges = true;
        }
      });
    });

    if (hasChanges) {
      setSentNotifications(newSent);
      saveSentNotifications(newSent);
    }
  }, [bills, permission, sentNotifications, sendNotification]);

  // Check notifications on mount and when bills change
  useEffect(() => {
    if (permission === "granted" && bills.length > 0) {
      // Check immediately
      checkBillNotifications();
      
      // Also check periodically (every hour)
      const interval = setInterval(checkBillNotifications, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [permission, bills, checkBillNotifications]);

  return {
    permission,
    requestPermission,
    sendNotification,
    checkBillNotifications,
  };
}
