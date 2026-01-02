import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already subscribed
  useEffect(() => {
    if (!user?.id) return;

    const checkSubscription = async () => {
      try {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        setIsSubscribed(data && data.length > 0);
      } catch (e) {
        console.error('Error checking subscription:', e);
      }
    };

    checkSubscription();
  }, [user?.id]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user?.id || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed at browser level
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription with userVisibleOnly
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }

      if (subscription) {
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        if (p256dh && auth) {
          // Save to database
          const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              endpoint: subscription.endpoint,
              p256dh: arrayBufferToBase64(p256dh),
              auth: arrayBufferToBase64(auth),
            }, {
              onConflict: 'user_id,endpoint',
            });

          if (error) {
            console.error('Error saving subscription:', error);
            return false;
          }

          setIsSubscribed(true);
          console.log('Push subscription saved successfully');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user?.id) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing subscription:', error);
        return false;
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
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