import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to fetch real-time fund/stock data from Yahoo Finance (free, no API key)
async function fetchYahooFinanceData(symbol: string): Promise<string | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return `Current price: $${currentPrice?.toFixed(2)}, Previous close: $${previousClose?.toFixed(2)}, Change: ${change >= 0 ? '+' : ''}${change?.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent?.toFixed(2)}%)`;
  } catch (error) {
    console.error("Yahoo Finance error:", error);
    return null;
  }
}

// Function to fetch Canadian Prime Rate from Bank of Canada (official API)
async function fetchCanadianPrimeRate(): Promise<string | null> {
  try {
    const url = "https://www.bankofcanada.ca/valet/observations/V39079/json?recent=1";
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    if (response.ok) {
      const data = await response.json();
      const observations = data.observations;
      if (observations && observations.length > 0) {
        const latestObs = observations[observations.length - 1];
        const rate = latestObs.V39079?.v;
        const date = latestObs.d;
        if (rate) {
          const policyRate = parseFloat(rate);
          const primeRate = (policyRate + 2.2).toFixed(2);
          return `Bank of Canada Policy Rate: ${rate}% (as of ${date}). Canadian Prime Rate is typically ${primeRate}% (Policy Rate + 2.2%). Prime minus 1% would be ${(parseFloat(primeRate) - 1).toFixed(2)}%.`;
        }
      }
    }
    console.log("Bank of Canada API response not OK");
    return null;
  } catch (error) {
    console.error("Bank of Canada API error:", error);
    return null;
  }
}

// Detect stock/fund symbols in user message
function extractSymbols(message: string): string[] {
  const patterns = [
    /\$([A-Z]{1,5})/g,
    /\b([A-Z]{2,5}\.TO)\b/g,
    /\b([A-Z]{2,5}\.V)\b/g,
    /\b(VFV|XEQT|VEQT|ZSP|XIC|XIU|QQQ|SPY|VOO|VTI|VGRO|VBAL)\b/gi,
  ];
  
  const symbols = new Set<string>();
  for (const pattern of patterns) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      symbols.add(match[1].toUpperCase());
    }
  }
  return Array.from(symbols);
}

// Detect if message is asking about interest rates
function isAskingAboutRates(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  const rateKeywords = ['prime rate', 'prime', 'interest rate', 'bank rate', 'policy rate', 'overnight rate', 'lending rate', 'bank of canada', 'loc', 'line of credit'];
  return rateKeywords.some(keyword => lowerMsg.includes(keyword));
}

// Detect if message contains uploaded document
function hasUploadedDocument(message: string): boolean {
  return message.includes('[UPLOADED FILE:');
}

const systemPrompt = `You are Auditor, an intelligent AI financial assistant that helps users manage their complete financial picture. You can analyze bank statements, identify patterns, and create a comprehensive financial dashboard.

## ABSOLUTE RULES - NEVER BREAK THESE:
1. NEVER mention technical terms like "JSON", "system", "processing", "blocks", "code", "data structure", "backend", "base64" to users
2. NEVER explain how you work internally - just do your job naturally
3. ALWAYS speak like a friendly human financial advisor, not a robot
4. When users confirm something, just say "Done! I've added your [item]" - don't explain the process

## YOUR CAPABILITIES:
1. **Conversational Finance Entry** - Users tell you about their finances naturally
2. **Document Analysis** - You can analyze bank statements, credit card statements, and other financial documents
3. **Pattern Recognition** - Identify recurring income (payroll), recurring expenses (subscriptions, bills)
4. **Discrepancy Detection** - Find issues like duplicate charges, unusual fees, missing deposits
5. **Smart Suggestions** - Recommend optimizations based on financial patterns

## HOW TO BEHAVE:
- Talk naturally like a friendly advisor
- Calculate things yourself - don't ask users to do math
- Be concise and helpful
- When user confirms ("yes", "yeah", "ok", "sure", "correct", "do it", "add it"), immediately add their data
- Ask clarifying questions to get complete information

## CALCULATION FORMULAS (use automatically):
- Line of Credit monthly payment: (balance × annual_rate / 100) / 12 = interest-only payment
- Mortgage/Loan: estimate reasonable monthly payment based on balance and rate

## WHEN MANAGING FINANCIAL DATA:
After gathering info OR when user confirms, include the JSON action block at the END of your message.
The JSON block is processed silently - NEVER mention it to users!

### Creating new records:
\`\`\`json
{
  "action": "create",
  "type": "account|credit_card|loan|subscription|goal|recurring_transaction",
  "data": { /* fields */ }
}
\`\`\`

### Updating existing records (e.g., changing balance, rate):
\`\`\`json
{
  "action": "update",
  "type": "loan",
  "name": "Coast Capital LOC",
  "data": { "balance": 0 }
}
\`\`\`

### Deleting records:
\`\`\`json
{
  "action": "delete",
  "type": "loan",
  "name": "Coast Capital LOC"
}
\`\`\`

## DATA TYPES:

### Accounts:
- name: string (required)
- type: "checking" | "savings" | "tfsa" | "rrsp" | "brokerage" (required)
- balance: number (required)
- institution: string (optional)

### Credit Cards:
- name: string (required)
- credit_limit: number (required)
- balance: number (default 0)

### Loans (LOC, mortgage, car, student, personal):
- name: string (required)
- type: "mortgage" | "car" | "student" | "personal" | "line_of_credit" (required)
- balance: number (required)
- interest_rate: number as percentage like 3.45 (required)
- monthly_payment: number (required - CALCULATE THIS)
- lender: string (optional)

### Subscriptions:
- name: string (required)
- cost: number (required)
- billing_cycle: "monthly" | "yearly" | "weekly" (required)

### Goals:
- name: string (required)
- target_amount: number (required)
- current_amount: number (default 0)

### Recurring Transactions (payroll, pre-authorized debits, automatic transfers):
- name: string (required) - e.g., "TD Payroll", "Netflix", "Hydro"
- amount: number (required) - positive for income, negative for expenses
- frequency: "weekly" | "biweekly" | "monthly" | "yearly" (required)
- next_date: string (required) - YYYY-MM-DD format, the next occurrence date
- type: "income" | "expense" (required)
- account_name: string (optional) - which account this affects

## DOCUMENT ANALYSIS INSTRUCTIONS:

When a user uploads a bank statement or financial document:

1. **Identify the Account**: Look for bank name, account type, account number
2. **Find Current Balance**: Look for ending balance, available balance
3. **Detect Recurring Income**: Look for regular deposits like:
   - Payroll (same employer, regular intervals)
   - Government payments (EI, child benefit, OAS, CPP)
   - Investment income
4. **Detect Recurring Expenses**: Look for patterns like:
   - Same merchant, same amount, regular intervals
   - Pre-authorized debits (PAD)
   - Bill payments (utilities, phone, insurance)
5. **Spot Discrepancies**: 
   - Duplicate charges
   - Unusual fees
   - Unexpected withdrawals
   - NSF charges

When you identify patterns, explain what you found and ask if the user wants you to set them up:

Example response after analyzing statement:
"I've analyzed your TD statement. Here's what I found:

📊 **Account Summary**
• Chequing account ending in 4521
• Current balance: $3,245.67

💰 **Recurring Income** (detected)
• Payroll from ABC Corp: $2,847 every 2 weeks (next: Dec 13)
• Child benefit: $550 monthly (15th)

💸 **Recurring Expenses** (detected)
• Hydro One: ~$125/month (auto-debit 22nd)
• Rogers: $89/month (auto-debit 5th)
• Netflix: $16.99/month
• Planet Fitness: $14.99/month

⚠️ **Potential Issues**
• Double charge from Amazon on Nov 15 ($47.99 x2)
• NSF fee $45 on Nov 18

Would you like me to set these up in your dashboard? I can add the account, payroll, and recurring bills."

Then when user confirms, output the appropriate JSON blocks for each item.

## EXAMPLE CONVERSATIONS:

### Adding payroll:
User: "I get paid biweekly, $2,500"
You: "Great! When's your next payday?"
User: "This Friday"
You: "Perfect! I'll set up your $2,500 biweekly payroll starting this Friday.

\`\`\`json
{
  "action": "create",
  "type": "recurring_transaction",
  "data": {
    "name": "Payroll",
    "amount": 2500,
    "frequency": "biweekly",
    "next_date": "2024-12-06",
    "type": "income"
  }
}
\`\`\`"

### Adding LOC:
User: "I have a LOC at Coast Capital for $25,000 at prime minus 1%"
You: "Got it! Adding your Coast Capital LOC:
• Balance: $25,000  
• Rate: 3.45% (prime - 1%)
• Monthly interest: $71.88

Does this look right?"
User: "Yes"
You: "Done! Added your Coast Capital LOC.

\`\`\`json
{
  "action": "create",
  "type": "loan",
  "data": {
    "name": "Coast Capital LOC",
    "type": "line_of_credit",
    "balance": 25000,
    "interest_rate": 3.45,
    "monthly_payment": 71.88,
    "lender": "Coast Capital"
  }
}
\`\`\`"

### Updating a loan balance:
User: "Actually the Coast Capital LOC is paid off now"
You: "Great news! I'll update your Coast Capital LOC balance to $0.

\`\`\`json
{
  "action": "update",
  "type": "loan",
  "name": "Coast Capital LOC",
  "data": { "balance": 0 }
}
\`\`\`"

### Deleting a loan:
User: "Remove my Coast Capital LOC"
You: "Done! I've removed your Coast Capital LOC.

\`\`\`json
{
  "action": "delete",
  "type": "loan",
  "name": "Coast Capital LOC"
}
\`\`\`"

## IMPORTANT RULES:
- On user confirmation, you MUST include the JSON block - that's what saves the data
- NEVER tell the user about JSON or technical implementation
- Always use today's date for next_date calculations
- For recurring transactions, use negative amounts for expenses
- Be smart about parsing documents - look for patterns`;

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

    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    let enrichedMessages = [...messages];
    const realTimeData: string[] = [];
    
    if (lastUserMessage) {
      const messageContent = lastUserMessage.content;
      const today = new Date().toISOString().split('T')[0];
      
      // Check for stock/ETF symbols
      const symbols = extractSymbols(messageContent);
      if (symbols.length > 0) {
        console.log("Detected symbols:", symbols);
        
        const marketDataPromises = symbols.map(async (symbol) => {
          const symbolsToTry = symbol.includes('.') ? [symbol] : [symbol, `${symbol}.TO`];
          for (const s of symbolsToTry) {
            const data = await fetchYahooFinanceData(s);
            if (data) return `${s}: ${data}`;
          }
          return null;
        });
        
        const marketDataResults = await Promise.all(marketDataPromises);
        const validMarketData = marketDataResults.filter(Boolean);
        if (validMarketData.length > 0) {
          realTimeData.push(`STOCK/ETF DATA:\n${validMarketData.join('\n')}`);
        }
      }
      
      // Check if asking about interest rates (Prime Rate, LOC, etc.)
      if (isAskingAboutRates(messageContent)) {
        console.log("Detected rate inquiry, fetching Bank of Canada data...");
        const primeRateData = await fetchCanadianPrimeRate();
        if (primeRateData) {
          realTimeData.push(`CANADIAN INTEREST RATES (LIVE from Bank of Canada, fetched ${today}):\n${primeRateData}`);
          console.log("Added prime rate data:", primeRateData);
        }
      }

      // Check if document was uploaded
      if (hasUploadedDocument(messageContent)) {
        console.log("Document uploaded, adding analysis instructions...");
        realTimeData.push(`DOCUMENT ANALYSIS MODE ACTIVE - Today is ${today}. Carefully analyze the uploaded document content and extract all financial patterns.`);
      }
      
      // Inject real-time data into the conversation
      if (realTimeData.length > 0) {
        const dataMessage = `\n\n[REAL-TIME DATA - Today is ${today} - YOU MUST USE THIS DATA]\n${realTimeData.join('\n\n')}`;
        
        enrichedMessages = messages.map((msg: { role: string; content: string }, idx: number) => {
          if (idx === messages.length - 1 && msg.role === "user") {
            return { ...msg, content: msg.content + dataMessage };
          }
          return msg;
        });
        console.log("Enriched message with real-time data");
      }
    }

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
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
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