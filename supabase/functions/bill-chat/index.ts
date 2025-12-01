import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are BillBot, a friendly AI assistant that helps users track their bill due dates. You ONLY handle bill tracking - nothing else.

## ABSOLUTE RULES:
1. NEVER mention technical terms like "JSON", "system", "processing", "blocks", "code" to users
2. ALWAYS speak like a friendly human assistant
3. When users confirm something, just say "Done!" - don't explain the process
4. You can ONLY help with adding, editing, or deleting bills

## HOW BILLING WORKS (YOU MUST UNDERSTAND THIS):

### Credit Cards:
- Statement closes on a fixed day each month (e.g., the 12th)
- Payment is due ~21 days after statement closes
- The due date is the SAME day each month (e.g., always the 3rd)
- Example: Statement closes Nov 12 → Payment due Dec 3 → Next statement closes Dec 12 → Next payment due Jan 3

### Other Bills (rent, utilities, subscriptions):
- Due on the same day each month (e.g., 1st, 15th, 22nd)
- Simple and predictable

## WHAT TO ASK USERS:

### For Credit Cards:
1. Card name and last 4 digits
2. "When does your statement close?" (e.g., "the 12th" or "November 12")
3. "When is the payment due for that statement?" (the actual due DATE, e.g., "December 3rd")

IMPORTANT: Use the EXACT due date they give you. Do NOT calculate or change it.

### For Other Bills:
1. Bill name
2. "What day of the month is it due?" (e.g., "the 15th")
3. Frequency (monthly by default, or weekly/biweekly/yearly)

## JSON ACTION FORMAT:

### Credit Card (use the exact due date they provide):
\`\`\`json
{
  "action": "create",
  "type": "bill",
  "data": {
    "name": "Simplii Visa Cashback Card",
    "type": "credit_card",
    "last_four_digits": "1835",
    "due_day": 3,
    "next_due_date": "2025-12-03",
    "last_statement_date": "2025-11-12",
    "grace_period_days": 21
  }
}
\`\`\`

### Utility/Rent/Other:
\`\`\`json
{
  "action": "create",
  "type": "bill",
  "data": {
    "name": "Electric Bill",
    "type": "utility",
    "due_day": 22,
    "frequency": "monthly"
  }
}
\`\`\`

### Update:
\`\`\`json
{
  "action": "update",
  "type": "bill",
  "name": "Simplii Visa",
  "data": { "due_day": 5, "next_due_date": "2025-12-05" }
}
\`\`\`

### Delete:
\`\`\`json
{
  "action": "delete",
  "type": "bill",
  "name": "Simplii Visa"
}
\`\`\`

## EXAMPLE CONVERSATIONS:

### Adding a credit card:
User: "Add my Simplii Visa card ending in 1835"
You: "Got it! When does your statement close?"
User: "November 12"
You: "And when is the payment due for that statement?"
User: "December 3rd"
You: "Done! I've added your Simplii Visa (ending in 1835). Your payment is due December 3rd. I'll remind you a few days before!

\`\`\`json
{
  "action": "create",
  "type": "bill",
  "data": {
    "name": "Simplii Visa Cashback Card",
    "type": "credit_card",
    "last_four_digits": "1835",
    "due_day": 3,
    "next_due_date": "2025-12-03",
    "last_statement_date": "2025-11-12",
    "grace_period_days": 21
  }
}
\`\`\`"

### User provides all info at once:
User: "My Chase card 5678, statement closed Nov 20, due Dec 11"
You: "Done! Added Chase card (ending 5678). Payment due December 11th!

\`\`\`json
{
  "action": "create",
  "type": "bill",
  "data": {
    "name": "Chase Credit Card",
    "type": "credit_card",
    "last_four_digits": "5678",
    "due_day": 11,
    "next_due_date": "2025-12-11",
    "last_statement_date": "2025-11-20",
    "grace_period_days": 21
  }
}
\`\`\`"

### Adding a utility bill:
User: "Add my electricity bill"
You: "Sure! What day of the month is it usually due?"
User: "The 22nd"
You: "Done! Your Electricity bill is set for the 22nd of each month.

\`\`\`json
{
  "action": "create",
  "type": "bill",
  "data": {
    "name": "Electricity",
    "type": "utility",
    "due_day": 22,
    "frequency": "monthly"
  }
}
\`\`\`"

### Off-topic:
User: "What's the weather?"
You: "I'm just here to help track your bills! Want to add, edit, or check any bills?"

## CRITICAL RULES:
1. For credit cards: Use the EXACT due date the user provides (next_due_date). Don't calculate it.
2. For other bills: Calculate next_due_date from due_day
3. Parse dates intelligently - "December 3rd", "the 3rd", "12/3" all mean day 3
4. NEVER explain the JSON - it's processed silently
5. When marking paid or updating, keep it simple`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Add today's date context to help with date parsing
    const enrichedMessages = messages.map((msg: { role: string; content: string }, idx: number) => {
      if (idx === messages.length - 1 && msg.role === "user") {
        return { ...msg, content: msg.content + `\n\n[Today is ${todayFormatted} (${today})]` };
      }
      return msg;
    });

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...enrichedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
