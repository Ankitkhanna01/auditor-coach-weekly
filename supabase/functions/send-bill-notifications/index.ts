import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.error('Missing email credentials (LOVABLE_API_KEY or RESEND_API_KEY)');
    return false;
  }
  try {
    const res = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Bill Reminders <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Email send failed [${res.status}]: ${txt}`);
      return false;
    }
    console.log(`Email sent to ${to}`);
    return true;
  } catch (e) {
    console.error('Email send error:', e);
    return false;
  }
}

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
  body: string,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      tag: 'bill-reminder',
      data: { url: '/app' },
    });

    console.log(`Attempting push to: ${subscription.endpoint.substring(0, 60)}...`);
    
    // Send the notification - for FCM/Push services that accept JSON payloads
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: payload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed with status ${response.status}: ${errorText}`);
      
      // 404/410 = subscription invalid
      if (response.status === 404 || response.status === 410) {
        console.log('Subscription no longer valid');
      }
      return false;
    }

    console.log(`Push sent successfully!`);
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
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all bills that are due soon and not paid
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
    let notificationsFailed = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    const userEmailCache: Record<string, string | null> = {};

    async function getUserEmail(userId: string): Promise<string | null> {
      if (userId in userEmailCache) return userEmailCache[userId];
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (error || !data?.user?.email) {
          userEmailCache[userId] = null;
          return null;
        }
        userEmailCache[userId] = data.user.email;
        return data.user.email;
      } catch (e) {
        console.error('getUserEmail failed:', e);
        userEmailCache[userId] = null;
        return null;
      }
    }

    for (const bill of bills || []) {
      // Skip if snoozed
      if (bill.snoozed_until && new Date(bill.snoozed_until) > now) {
        console.log(`Skipping ${bill.name} - snoozed`);
        continue;
      }

      const businessDays = getBusinessDaysUntilDue(bill.next_due_date);
      const userSubs = subsByUser[bill.user_id];

      console.log(`Bill "${bill.name}": ${businessDays} business days, ${userSubs?.length || 0} subscriptions`);

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

          console.log(`Sending: "${title}" - "${body}"`);

          // Send push to all user's subscriptions
          if (userSubs && userSubs.length > 0) {
            for (const sub of userSubs) {
              const success = await sendPushNotification(sub, title, body, vapidPublicKey);
              if (success) notificationsSent++; else notificationsFailed++;
            }
          }

          // Send email reminder
          const email = await getUserEmail(bill.user_id);
          if (email) {
            const html = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
                <h2 style="margin: 0 0 8px;">${title}</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">${body}</p>
                <p style="font-size: 14px; color: #666; margin-top: 24px;">Open the app to mark it paid or snooze the reminder.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 12px; color: #999;">You're receiving this because you have a bill reminder set up.</p>
              </div>
            `;
            const ok = await sendEmail(email, title, html);
            if (ok) emailsSent++; else emailsFailed++;
          } else {
            console.log(`No email found for user ${bill.user_id}`);
          }
          
          break;
        }
      }
    }

    console.log(`Done: push sent ${notificationsSent} (failed ${notificationsFailed}), emails sent ${emailsSent} (failed ${emailsFailed})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        billsChecked: bills?.length || 0,
        notificationsSent,
        notificationsFailed,
        emailsSent,
        emailsFailed,
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
