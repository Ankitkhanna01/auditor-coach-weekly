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
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bill-chat`;
const STORAGE_KEY = 'bill-chat-messages';
const EXECUTED_KEY = 'bill-chat-executed';

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hey! 👋 I'm here to help you track your bills. Tell me about a bill you'd like to add - like a credit card, utility, or subscription. I'll make sure you get reminded 5 days before it's due!"
};

export function BillChat({ contextMessage, onContextUsed }: BillChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const [contextProcessed, setContextProcessed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { bills, addBill, updateBill, deleteBill } = useBills();

  // Get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Load chat history
  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error("Failed to parse chat history:", e);
        }
      }
      
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
  }, [userId]);

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

  // Save chat history
  useEffect(() => {
    if (userId && messages.length > 1) {
      localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(messages));
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

  // Clear history
  const clearHistory = () => {
    setMessages([INITIAL_MESSAGE]);
    setExecutedActions(new Set());
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY}-${userId}`);
      localStorage.removeItem(`${EXECUTED_KEY}-${userId}`);
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
          next_due_date: action.data.next_due_date, // Use exact date from AI
        });
        setExecutedActions(prev => new Set([...prev, actionKey]));
      } else if (action.action === "update" && action.type === "bill") {
        await updateBill({ name: action.name, data: action.data });
        setExecutedActions(prev => new Set([...prev, actionKey]));
      } else if (action.action === "delete" && action.type === "bill") {
        await deleteBill(action.name);
        setExecutedActions(prev => new Set([...prev, actionKey]));
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