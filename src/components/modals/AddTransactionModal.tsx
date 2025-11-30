import { useState } from "react";
import { X } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";

interface AddTransactionModalProps {
  cardId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'dining', label: 'Dining', emoji: '🍽️' },
  { id: 'gas', label: 'Gas', emoji: '⛽' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'transport', label: 'Transport', emoji: '🚗' },
  { id: 'health', label: 'Health', emoji: '💊' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export function AddTransactionModal({ cardId, isOpen, onClose }: AddTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const { creditCards, addCardTransaction } = useFinanceData();

  const card = creditCards.find(c => c.id === cardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardId && amount && category) {
      addCardTransaction.mutate({
        cardId,
        amount: parseFloat(amount),
        merchant: merchant || "Unknown",
        category
      });
      setAmount("");
      setMerchant("");
      setCategory("");
      onClose();
    }
  };

  if (!isOpen) return null;

  // Show message if no cards exist
  if (!card) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-[420px] bg-card rounded-t-3xl p-6 animate-slide-up">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-xl font-bold mb-2">No Credit Cards</h2>
            <p className="text-muted-foreground mb-6">Add a credit card first to track transactions.</p>
            <button onClick={onClose} className="btn-premium">Got it</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[420px] bg-card rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Add Transaction</h2>
            <p className="text-sm text-muted-foreground">{card.name}</p>
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
            <label className="text-sm text-muted-foreground mb-2 block">Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g., Costco, Starbucks..."
              className={cn(
                "w-full px-4 py-3",
                "bg-muted rounded-xl border border-border",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "placeholder:text-muted-foreground/50"
              )}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                    category === cat.id 
                      ? "bg-primary text-primary-foreground scale-105" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-premium w-full mt-6"
            disabled={!amount || !category}
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
