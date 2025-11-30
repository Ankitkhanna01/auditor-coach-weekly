import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  CreditCard as CardIcon,
  TrendingDown,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";

const cardGradients = [
  'from-violet-600 via-purple-600 to-indigo-600',
  'from-emerald-600 via-teal-600 to-cyan-600',
  'from-rose-600 via-pink-600 to-fuchsia-600',
  'from-amber-600 via-orange-600 to-red-600',
];

export function CreditCards() {
  const { creditCards, isLoading } = useFinanceData();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  const totalBalance = creditCards.reduce((sum, card) => sum + Number(card.balance), 0);
  const totalTodaySpent = creditCards.reduce((sum, card) => sum + Number(card.today_spent || 0), 0);

  // Mock card optimization data
  const optimizations = [
    { category: 'Groceries', currentCard: 'TD Cashback', bestCard: 'Amex Cobalt', missedCashback: 12 },
    { category: 'Gas', currentCard: 'Amex Cobalt', bestCard: 'TD Cashback', missedCashback: 8 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8 stagger-children">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Credit Cards</h1>
        <p className="text-muted-foreground text-sm">Track spending & rewards</p>
      </div>

      {/* Total Spending Today */}
      <GlassCard elevated className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial opacity-40" />
        <div className="relative">
          <p className="text-muted-foreground text-sm mb-1">Total Balance</p>
          <AnimatedCounter 
            value={totalBalance} 
            prefix="$" 
            className="text-3xl font-bold"
          />
          <div className="flex items-center gap-1 mt-2 text-destructive text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>+${totalTodaySpent} spent today</span>
          </div>
        </div>
      </GlassCard>

      {/* Cards List */}
      <div className="space-y-4 mb-6">
        {creditCards.map((card, index) => (
          <div key={card.id} className="space-y-2">
            {/* Card Visual */}
            <div className={cn(
              "relative h-44 rounded-2xl p-5 overflow-hidden bg-gradient-to-br shadow-elevated",
              cardGradients[index % cardGradients.length]
            )}>
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full" />
              
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/70 text-xs mb-1">{card.name}</p>
                    <AnimatedCounter 
                      value={Number(card.balance)} 
                      prefix="$" 
                      className="text-2xl font-bold text-white"
                    />
                  </div>
                  <CardIcon className="w-8 h-8 text-white/50" />
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/70 text-xs">Cashback Rate</p>
                    <p className="text-white font-semibold">{card.cashback_rate || 0}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Due Date</p>
                    <p className="text-white font-semibold">
                      {card.due_date ? new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedCardId(card.id)}
                className="flex-1 glass-card py-3 text-center text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                + Add Transaction
              </button>
              <GlassCard className="flex items-center gap-2 px-4 py-3">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-destructive font-medium">+${Number(card.today_spent || 0)}</span>
                  <span className="text-muted-foreground">today</span>
                </div>
              </GlassCard>
            </div>
          </div>
        ))}

        {creditCards.length === 0 && (
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="font-medium mb-2">No credit cards yet</p>
            <p className="text-muted-foreground text-sm">
              Use the chat to add cards or upload your credit card statement
            </p>
          </GlassCard>
        )}
      </div>

      {/* Card Optimization */}
      {creditCards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold">Optimize Your Cards</h2>
          </div>

          <div className="space-y-3">
            {optimizations.map((opt, index) => (
              <GlassCard key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{opt.category}</p>
                    <p className="text-xs text-muted-foreground">
                      Switch from {opt.currentCard} → {opt.bestCard}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">+${opt.missedCashback}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        cardId={selectedCardId}
        isOpen={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
}