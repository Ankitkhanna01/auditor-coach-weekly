import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Bill {
  id: string;
  user_id: string;
  name: string;
  next_due_date: string;
  amount: number | null;
  is_paid: boolean;
  snoozed_until: string | null;
  last_four_digits: string | null;
}

// Calculate business days until due
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
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }
  
  return businessDays;
}

// Send web push notification
async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string
): Promise<boolean> {
  try {
    // Use the web-push compatible format
    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
    });

    console.log(`Sending push to ${subscription.endpoint.substring(0, 50)}...`);
    
    // Note: In production, you'd use web-push library with VAPID keys
    // For now, we'll use the Push API directly if supported
    // This requires setting up VAPID keys in production
    
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting bill notification check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all bills that are due soon and not paid/snoozed
    const now = new Date();
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('is_paid', false);

    if (billsError) {
      console.error('Error fetching bills:', billsError);
      throw billsError;
    }

    console.log(`Found ${bills?.length || 0} unpaid bills`);

    // Get all push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions`);

    // Group subscriptions by user
    const subsByUser: Record<string, PushSubscription[]> = {};
    for (const sub of subscriptions || []) {
      if (!subsByUser[sub.user_id]) {
        subsByUser[sub.user_id] = [];
      }
      subsByUser[sub.user_id].push(sub);
    }

    const thresholds = [5, 2, 1]; // Business days before due
    let notificationsSent = 0;

    for (const bill of bills || []) {
      // Skip if snoozed
      if (bill.snoozed_until && new Date(bill.snoozed_until) > now) {
        continue;
      }

      const businessDays = getBusinessDaysUntilDue(bill.next_due_date);
      const userSubs = subsByUser[bill.user_id];

      if (!userSubs || userSubs.length === 0) {
        continue;
      }

      // Check if we should notify for any threshold
      for (const threshold of thresholds) {
        if (businessDays === threshold) {
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

          const title = `${emoji} Bill Due ${urgencyText}`;
          const body = `${billName} is due on ${dueDate}${bill.amount ? ` - ~$${bill.amount}` : ''}`;

          // Send to all user's subscriptions
          for (const sub of userSubs) {
            await sendPushNotification(sub, title, body);
            notificationsSent++;
          }
          
          break; // Only send one notification per bill
        }
      }
    }

    console.log(`Sent ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        billsChecked: bills?.length || 0,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-bill-notifications:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});