import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, Trash2, Paperclip, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; type: string }[];
}

interface FinanceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;
const STORAGE_KEY = "auditor-chat-history";
const EXECUTED_KEY = "auditor-executed-actions";

const INITIAL_MESSAGE: Message = { 
  role: "assistant", 
  content: "Hi! I'm Auditor, your AI financial assistant. I can help you:\n\n📊 **Manage your finances** - Tell me about accounts, loans, cards\n📄 **Analyze statements** - Upload bank or credit card statements\n💰 **Track recurring** - Set up payroll, bills, subscriptions\n🔍 **Find discrepancies** - I'll spot issues in your finances\n\nTry: \"Upload my bank statement\" or tell me about your finances!" 
};

export function FinanceChat({ isOpen, onClose }: FinanceChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.length > 0 ? parsed : [INITIAL_MESSAGE];
        } catch {
          return [INITIAL_MESSAGE];
        }
      }
    }
    return [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    addAccount, addCreditCard, addLoan, updateLoan, deleteLoan, addSubscription, addGoal, 
    addRecurringTransaction, accounts, creditCards, loans, subscriptions, goals, recurringTransactions 
  } = useFinanceData();

  // Load messages when user changes
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMessages(parsed.length > 0 ? parsed : [INITIAL_MESSAGE]);
        } catch {
          setMessages([INITIAL_MESSAGE]);
        }
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    }
  }, [user?.id]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user?.id && messages.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const clearHistory = () => {
    setMessages([INITIAL_MESSAGE]);
    setExecutedActions(new Set());
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify([INITIAL_MESSAGE]));
      localStorage.removeItem(`${EXECUTED_KEY}-${user.id}`);
    }
    toast.success("Chat history cleared");
  };

  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`${EXECUTED_KEY}-${user.id}`);
      if (stored) {
        try {
          setExecutedActions(new Set(JSON.parse(stored)));
        } catch {
          setExecutedActions(new Set());
        }
      } else {
        setExecutedActions(new Set());
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && executedActions.size > 0) {
      localStorage.setItem(`${EXECUTED_KEY}-${user.id}`, JSON.stringify([...executedActions]));
    }
  }, [executedActions, user?.id]);

  const executeAction = (jsonStr: string, forceExecute = false) => {
    const actionKey = jsonStr.trim();
    if (!forceExecute && executedActions.has(actionKey)) {
      console.log("Action already executed, skipping");
      return false;
    }

    try {
      const action = JSON.parse(jsonStr);
      console.log("Executing action:", action);
      
      const markExecuted = () => {
        setExecutedActions(prev => new Set([...prev, actionKey]));
      };
      
      const handleError = (error: Error) => {
        console.error("Failed to save:", error);
        toast.error("Failed to save. Please try again.");
      };

      if (action.action === "create") {
        switch (action.type) {
          case "account":
            addAccount.mutate(action.data, {
              onSuccess: () => { toast.success("Account added!"); markExecuted(); },
              onError: handleError
            });
            break;
          case "credit_card":
            addCreditCard.mutate(action.data, {
              onSuccess: () => { toast.success("Credit card added!"); markExecuted(); },
              onError: handleError
            });
            break;
          case "loan":
            addLoan.mutate(action.data, {
              onSuccess: () => { toast.success("Loan added!"); markExecuted(); },
              onError: handleError
            });
            break;
          case "subscription":
            addSubscription.mutate(action.data, {
              onSuccess: () => { toast.success("Subscription added!"); markExecuted(); },
              onError: handleError
            });
            break;
          case "goal":
            addGoal.mutate(action.data, {
              onSuccess: () => { toast.success("Goal added!"); markExecuted(); },
              onError: handleError
            });
            break;
          case "recurring_transaction":
            addRecurringTransaction.mutate(action.data, {
              onSuccess: () => { toast.success("Recurring transaction added!"); markExecuted(); },
              onError: handleError
            });
            break;
        }
        return true;
      }
      
      if (action.action === "update") {
        switch (action.type) {
          case "loan":
            updateLoan.mutate({ name: action.name, id: action.id, updates: action.data }, {
              onSuccess: () => { toast.success("Loan updated!"); markExecuted(); },
              onError: handleError
            });
            break;
        }
        return true;
      }
      
      if (action.action === "delete") {
        switch (action.type) {
          case "loan":
            deleteLoan.mutate({ name: action.name, id: action.id }, {
              onSuccess: () => { toast.success("Loan deleted!"); markExecuted(); },
              onError: handleError
            });
            break;
        }
        return true;
      }
    } catch (e) {
      console.error("Failed to parse action:", e);
      toast.error("Failed to process. Please try again.");
    }
    return false;
  };

  const parseAndExecuteAction = (content: string, userInput: string, allMessages: Message[]) => {
    const confirmationWords = ['yes', 'yeah', 'yep', 'correct', 'ok', 'okay', 'sure', 'confirm', 'do it', 'add it', 'save it', 'save', 'add', 'go ahead', 'looks good', 'that\'s right', 'perfect'];
    const userInputLower = userInput.toLowerCase().trim();
    
    const isConfirmation = confirmationWords.some(word => 
      userInputLower === word || userInputLower.includes(word)
    );

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      if (isConfirmation) {
        console.log("User confirmed, executing JSON from current response");
        return executeAction(jsonMatch[1], true);
      }
    }

    if (isConfirmation) {
      for (let i = allMessages.length - 1; i >= 0; i--) {
        const msg = allMessages[i];
        if (msg.role === 'assistant') {
          const prevJsonMatch = msg.content.match(/```json\s*([\s\S]*?)\s*```/);
          if (prevJsonMatch) {
            console.log("User confirmed, executing JSON from previous message");
            return executeAction(prevJsonMatch[1], true);
          }
        }
      }
    }
    
    return false;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        toast.error("Please upload a PDF, CSV, or Excel file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const buildContextMessage = () => {
    // Build a context message with current financial data
    const context: string[] = [];
    
    if (accounts.length > 0) {
      context.push(`Current accounts: ${accounts.map(a => `${a.name} ($${a.balance})`).join(', ')}`);
    }
    if (creditCards.length > 0) {
      context.push(`Credit cards: ${creditCards.map(c => `${c.name} (Balance: $${c.balance}, Limit: $${c.credit_limit})`).join(', ')}`);
    }
    if (loans.length > 0) {
      context.push(`Loans: ${loans.map(l => `${l.name} ($${l.balance} at ${l.interest_rate}%)`).join(', ')}`);
    }
    if (subscriptions.length > 0) {
      context.push(`Subscriptions: ${subscriptions.map(s => `${s.name} ($${s.cost}/${s.billing_cycle})`).join(', ')}`);
    }
    if (goals.length > 0) {
      context.push(`Goals: ${goals.map(g => `${g.name} ($${g.current_amount}/$${g.target_amount})`).join(', ')}`);
    }
    if (recurringTransactions.length > 0) {
      context.push(`Recurring: ${recurringTransactions.map(r => `${r.name} ($${r.amount} ${r.frequency})`).join(', ')}`);
    }
    
    return context.length > 0 ? `\n\n[USER'S CURRENT FINANCIAL DATA]\n${context.join('\n')}` : '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;

    let messageContent = input.trim();
    let attachments: { name: string; type: string }[] | undefined;
    let fileContent = "";

    // Handle file upload
    if (selectedFile) {
      setIsParsingFile(true);
      try {
        const base64Content = await readFileAsBase64(selectedFile);
        fileContent = `\n\n[UPLOADED FILE: ${selectedFile.name}]\nFile type: ${selectedFile.type}\nFile content (base64): ${base64Content.substring(0, 50000)}...`;
        attachments = [{ name: selectedFile.name, type: selectedFile.type }];
        
        if (!messageContent) {
          messageContent = `I've uploaded my ${selectedFile.name.includes('bank') ? 'bank' : 'financial'} statement. Please analyze it and help me set up my finances.`;
        }
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Failed to read file");
        setIsParsingFile(false);
        return;
      }
      setIsParsingFile(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const userMessage: Message = { 
      role: "user", 
      content: messageContent,
      attachments 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const contextMessage = buildContextMessage();
      const recentMessages = [...messages, userMessage].slice(-10).map(m => ({
        role: m.role,
        content: m.content + (m === userMessage ? fileContent + contextMessage : '')
      }));
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: recentMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      const updatedMessages = [...messages, userMessage, { role: "assistant" as const, content: assistantContent }];
      parseAndExecuteAction(assistantContent, userMessage.content, updatedMessages);

    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const cleanMessageContent = (content: string) => {
    return content.replace(/```json[\s\S]*?```/g, '').trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[420px] h-[650px] bg-card rounded-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold">Auditor AI</h2>
              <p className="text-xs text-muted-foreground">Your financial assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={clearHistory} 
              className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className="max-w-[80%] space-y-1">
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{message.attachments[0].name}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {cleanMessageContent(message.content)}
                </div>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4 text-primary" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isParsingFile}
              className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
              title="Upload bank statement"
            >
              {isParsingFile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about your finances..."
              className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="w-12 h-12 shrink-0 rounded-xl bg-gradient-primary flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}