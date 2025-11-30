import { useState } from "react";
import { X } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";

interface AddBalanceModalProps {
  accountId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddBalanceModal({ accountId, isOpen, onClose }: AddBalanceModalProps) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const { accounts, addToBalance } = useFinanceData();

  const account = accounts.find(a => a.id === accountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountId && amount) {
      addToBalance.mutate({ 
        id: accountId, 
        amount: parseFloat(amount), 
        source: source || "Unspecified" 
      });
      setAmount("");
      setSource("");
      onClose();
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[420px] bg-card rounded-t-3xl p-6 animate-slide-up">
        {/* Handle */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Add to Balance</h2>
            <p className="text-sm text-muted-foreground">{account.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full pl-10 pr-4 py-4 text-2xl font-bold",
                  "bg-muted rounded-xl border border-border",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "placeholder:text-muted-foreground/50"
                )}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Where did this money come from?
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Salary, Transfer, Gift..."
              className={cn(
                "w-full px-4 py-3",
                "bg-muted rounded-xl border border-border",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "placeholder:text-muted-foreground/50"
              )}
            />
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {[100, 250, 500, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                  amount === val.toString() 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                ${val}
              </button>
            ))}
          </div>

          <button type="submit" className="btn-premium w-full mt-6">
            Add ${amount || "0"} to Balance
          </button>
        </form>
      </div>
    </div>
  );
}
