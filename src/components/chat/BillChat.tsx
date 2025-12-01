import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBills } from "@/hooks/useBills";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BillChatProps {
  contextMessage?: string | null;
  onContextUsed?: () => void;
  isActive?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bill-chat`;
const STORAGE_KEY = 'bill-chat-messages';
const EXECUTED_KEY = 'bill-chat-executed';
const CHAT_TIMESTAMP_KEY = 'bill-chat-timestamp';
const LAST_VISIT_KEY = 'bill-chat-last-visit';
const LAST_ACTIVITY_KEY = 'bill-chat-last-activity';
const SESSION_GREETED_KEY = 'bill-chat-session-greeted';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getActionPrompt = (bills: any[]) => {
  const greeting = getGreeting();
  if (bills.length === 0) {
    return `${greeting}! 👋 Ready to get started? Tell me about a bill you'd like to track - credit card, utility, subscription, or any recurring payment.`;
  }
  return `${greeting}! 👋 You're tracking ${bills.length} bill${bills.length > 1 ? 's' : ''}. What would you like to do?\n\n• Add a new bill\n• Update an existing bill\n• Delete a bill`;
};

const getWelcomeMessage = (lastVisit: number | null, lastActivity: string | null, bills: any[]) => {
  const now = Date.now();
  const greeting = getGreeting();
  
  // First time user
  if (!lastVisit) {
    return `${greeting}! 👋 What bills would you like to add or manage today?`;
  }
  
  const daysSinceVisit = Math.floor((now - lastVisit) / ONE_DAY_MS);
  
  // Same day
  if (daysSinceVisit < 1) {
    return `${greeting}! What bills would you like to add or manage today?`;
  }
  
  // Been away for a while
  let message = "";
  
  if (daysSinceVisit >= 30) {
    message = `Welcome back! We missed you! 🎉 It's been over a month since your last visit.`;
  } else if (daysSinceVisit >= 14) {
    message = `Welcome back! We missed you! It's been ${Math.floor(daysSinceVisit / 7)} weeks since we last chatted.`;
  } else if (daysSinceVisit >= 7) {
    message = `Welcome back! It's been about a week since your last visit.`;
  } else if (daysSinceVisit >= 2) {
    message = `${greeting}! Good to see you again after ${daysSinceVisit} days.`;
  } else {
    message = `${greeting}! Welcome back!`;
  }
  
  // Add last activity reminder
  if (lastActivity) {
    message += `\n\nLast time you were here, ${lastActivity}`;
  }
  
  // Add bill summary if they have bills
  if (bills.length > 0) {
    message += `\n\nYou're currently tracking ${bills.length} bill${bills.length > 1 ? 's' : ''}.`;
  }
  
  message += `\n\nWhat would you like to do today?`;
  
  return message;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: `${getGreeting()}! 👋 What bills would you like to add or manage today?`
};

export function BillChat({ contextMessage, onContextUsed, isActive }: BillChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const [contextProcessed, setContextProcessed] = useState(false);
  const [sessionGreeted, setSessionGreeted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { bills, addBill, updateBill, deleteBill } = useBills();

  // Get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Show fresh action prompt when chat becomes active (once per session)
  useEffect(() => {
    if (isActive && userId && !sessionGreeted && !contextMessage) {
      // Check if already greeted this browser session
      const alreadyGreeted = sessionStorage.getItem(`${SESSION_GREETED_KEY}-${userId}`);
      if (!alreadyGreeted) {
        const actionPrompt = getActionPrompt(bills);
        setMessages(prev => {
          // Only add if last message isn't already a fresh greeting
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === "assistant" && lastMsg.content.includes("What would you like to do")) {
            return prev;
          }
          return [...prev, { role: "assistant", content: actionPrompt }];
        });
        sessionStorage.setItem(`${SESSION_GREETED_KEY}-${userId}`, "true");
        setSessionGreeted(true);
      }
    }
  }, [isActive, userId, sessionGreeted, contextMessage, bills.length]);

  // Load chat history and auto-delete if older than 7 days
  useEffect(() => {
    if (userId) {
      // Get last visit and last activity
      const lastVisitStored = localStorage.getItem(`${LAST_VISIT_KEY}-${userId}`);
      const lastVisit = lastVisitStored ? parseInt(lastVisitStored, 10) : null;
      const lastActivity = localStorage.getItem(`${LAST_ACTIVITY_KEY}-${userId}`);
      
      // Check chat timestamp
      const timestampStored = localStorage.getItem(`${CHAT_TIMESTAMP_KEY}-${userId}`);
      const timestamp = timestampStored ? parseInt(timestampStored, 10) : 0;
      const now = Date.now();
      
      // If chat is older than 7 days, clear messages but keep last activity
      if (timestamp && (now - timestamp) > SEVEN_DAYS_MS) {
        localStorage.removeItem(`${STORAGE_KEY}-${userId}`);
        localStorage.removeItem(`${EXECUTED_KEY}-${userId}`);
        localStorage.removeItem(`${CHAT_TIMESTAMP_KEY}-${userId}`);
        // Generate welcome back message with last activity
        const welcomeMsg = getWelcomeMessage(lastVisit, lastActivity, bills);
        setMessages([{ role: "assistant", content: welcomeMsg }]);
        // Update last visit
        localStorage.setItem(`${LAST_VISIT_KEY}-${userId}`, now.toString());
        return;
      }
      
      const stored = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check if this is a returning user (more than a day since last visit)
            if (lastVisit && (now - lastVisit) > ONE_DAY_MS) {
              // Add welcome back message at the end
              const welcomeMsg = getWelcomeMessage(lastVisit, lastActivity, bills);
              setMessages([...parsed, { role: "assistant", content: welcomeMsg }]);
            } else {
              setMessages(parsed);
            }
          }
        } catch (e) {
          console.error("Failed to parse chat history:", e);
        }
      } else {
        // No stored messages - show welcome message
        const welcomeMsg = getWelcomeMessage(lastVisit, lastActivity, bills);
        setMessages([{ role: "assistant", content: welcomeMsg }]);
      }
      
      // Update last visit timestamp
      localStorage.setItem(`${LAST_VISIT_KEY}-${userId}`, now.toString());
      
      // Load executed actions
      const executedStored = localStorage.getItem(`${EXECUTED_KEY}-${userId}`);
      if (executedStored) {
        try {
          const parsed = JSON.parse(executedStored);
          setExecutedActions(new Set(parsed));
        } catch (e) {
          console.error("Failed to parse executed actions:", e);
        }
      }
    }
  }, [userId, bills.length]);

  // Handle context message from bill click
  useEffect(() => {
    if (contextMessage && userId && !contextProcessed && !isLoading) {
      setContextProcessed(true);
      // Add a contextual assistant message asking what to change
      const contextualMessage: Message = {
        role: "assistant",
        content: contextMessage
      };
      setMessages(prev => [...prev, contextualMessage]);
      onContextUsed?.();
    }
  }, [contextMessage, userId, contextProcessed, isLoading, onContextUsed]);

  // Reset context processed flag when context changes
  useEffect(() => {
    if (!contextMessage) {
      setContextProcessed(false);
    }
  }, [contextMessage]);

  // Save chat history with timestamp
  useEffect(() => {
    if (userId && messages.length > 1) {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(messages));
      // Update timestamp on first save or if not set
      if (!localStorage.getItem(`${CHAT_TIMESTAMP_KEY}-${userId}`)) {
        localStorage.setItem(`${CHAT_TIMESTAMP_KEY}-${userId}`, Date.now().toString());
      }
    }
  }, [messages, userId]);

  // Save executed actions
  useEffect(() => {
    if (userId && executedActions.size > 0) {
      localStorage.setItem(`${EXECUTED_KEY}-${userId}`, JSON.stringify([...executedActions]));
    }
  }, [executedActions, userId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear history (but keep last activity for future welcome back)
  const clearHistory = () => {
    const welcomeMsg = `${getGreeting()}! What bills would you like to add or manage today?`;
    setMessages([{ role: "assistant", content: welcomeMsg }]);
    setExecutedActions(new Set());
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY}-${userId}`);
      localStorage.removeItem(`${EXECUTED_KEY}-${userId}`);
      localStorage.removeItem(`${CHAT_TIMESTAMP_KEY}-${userId}`);
      // Keep LAST_VISIT_KEY and LAST_ACTIVITY_KEY for welcome back feature
    }
  };

  // Save last activity when action is executed
  const saveLastActivity = (activity: string) => {
    if (userId) {
      localStorage.setItem(`${LAST_ACTIVITY_KEY}-${userId}`, activity);
    }
  };

  // Execute action from AI response
  const executeAction = async (actionJson: string) => {
    // Create a unique key for this action
    const actionKey = actionJson.trim();
    
    // Skip if already executed
    if (executedActions.has(actionKey)) {
      return;
    }

    try {
      const action = JSON.parse(actionJson);
      
      if (action.action === "create" && action.type === "bill") {
        await addBill({
          name: action.data.name,
          type: action.data.type || "other",
          last_four_digits: action.data.last_four_digits,
          due_day: action.data.due_day,
          amount: action.data.amount,
          frequency: action.data.frequency || "monthly",
          billing_cycle_days: action.data.billing_cycle_days,
          grace_period_days: action.data.grace_period_days,
          last_statement_date: action.data.last_statement_date,
          next_due_date: action.data.next_due_date,
        });
        setExecutedActions(prev => new Set([...prev, actionKey]));
        saveLastActivity(`you added "${action.data.name}" to your bills.`);
      } else if (action.action === "update" && action.type === "bill") {
        await updateBill({ name: action.name, data: action.data });
        setExecutedActions(prev => new Set([...prev, actionKey]));
        saveLastActivity(`you updated "${action.name}".`);
      } else if (action.action === "delete" && action.type === "bill") {
        await deleteBill(action.name);
        setExecutedActions(prev => new Set([...prev, actionKey]));
        saveLastActivity(`you deleted "${action.name}" from your bills.`);
      }
    } catch (e) {
      console.error("Failed to execute action:", e);
    }
  };

  // Parse and execute actions from response
  const parseAndExecuteActions = async (content: string) => {
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
    let match;
    
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      await executeAction(match[1]);
    }
  };

  // Build context with current bills
  const buildContext = () => {
    if (bills.length === 0) return "";
    
    const billsList = bills.map(b => {
      let desc = `- ${b.name} (${b.type})`;
      if (b.last_four_digits) desc += ` ending in ${b.last_four_digits}`;
      
      // Check if day-based bill (credit cards/loans with billing cycle info)
      if (['credit_card', 'loan'].includes(b.type) && b.billing_cycle_days && b.last_statement_date) {
        desc += `, ${b.billing_cycle_days}-day cycle, ${b.grace_period_days || 21}-day grace`;
        desc += `, next due: ${b.next_due_date}`;
      } else {
        const frequencyLabels: Record<string, string> = {
          weekly: 'every week',
          biweekly: 'every 2 weeks',
          monthly: 'each month',
          yearly: 'each year',
        };
        const freq = b.frequency || 'monthly';
        desc += `, due on the ${b.due_day}${getDaySuffix(b.due_day)} ${frequencyLabels[freq] || 'each month'}`;
      }
      if (b.amount) desc += `, ~$${b.amount}`;
      if (b.is_paid && b.paid_at) {
        desc += ` [PAID on ${new Date(b.paid_at).toLocaleDateString()}]`;
      }
      return desc;
    }).join('\n');
    
    return `\n\n[Current bills being tracked:\n${billsList}]`;
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Clean message content (remove JSON blocks for display)
  const cleanMessageContent = (content: string) => {
    return content.replace(/```json[\s\S]*?```/g, '').trim();
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const context = buildContext();
    const userMessageWithContext: Message = { 
      role: "user", 
      content: input.trim() + context 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get recent messages for context (last 10)
      const recentMessages = [...messages.slice(-10), userMessageWithContext].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: recentMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Execute any actions in the response
      await parseAndExecuteActions(assistantContent);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">BillBot</h2>
            <p className="text-xs text-muted-foreground">Your bill tracking assistant</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {messages.map((message, index) => {
          const displayContent = cleanMessageContent(message.content);
          if (!displayContent) return null;
          
          return (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  message.role === "user"
                    ? "bg-gradient-to-br from-violet-500 to-cyan-500"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  message.role === "user"
                    ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
                    : "glass-card"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
              </div>
            </div>
          );
        })}
        
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="glass-card rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom above nav */}
      <div className="fixed bottom-16 left-0 right-0 p-4 border-t border-border/50 bg-background z-30">
        <div className="max-w-[420px] mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Tell me about a bill to track..."
            className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:opacity-90 rounded-xl px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}