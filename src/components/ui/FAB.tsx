import { useState } from "react";
import { Plus, X, CreditCard, Wallet, Target, Receipt, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}

interface FABProps {
  onAddTransaction: () => void;
  onAddAccount: () => void;
  onAddGoal: () => void;
  onAddSubscription: () => void;
  onOpenChat?: () => void;
}

export function FAB({ onAddTransaction, onAddAccount, onAddGoal, onAddSubscription, onOpenChat }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: FABAction[] = [
    { icon: <MessageCircle className="w-5 h-5" />, label: "AI Chat", onClick: onOpenChat || (() => {}), highlight: true },
    { icon: <CreditCard className="w-5 h-5" />, label: "Transaction", onClick: onAddTransaction },
    { icon: <Wallet className="w-5 h-5" />, label: "Account", onClick: onAddAccount },
    { icon: <Target className="w-5 h-5" />, label: "Goal", onClick: onAddGoal },
    { icon: <Receipt className="w-5 h-5" />, label: "Subscription", onClick: onAddSubscription },
  ];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col-reverse gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 glass-card-elevated rounded-full",
              "hover:scale-105 transition-all duration-200",
              "text-sm font-medium",
              action.highlight && "ring-2 ring-primary/50"
            )}
            style={{ 
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateX(0)' : 'translateX(20px)'
            }}
          >
            <span className={cn("gradient-text", action.highlight && "font-bold")}>{action.label}</span>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              action.highlight ? "bg-gradient-to-r from-violet-600 to-cyan-500" : "bg-gradient-primary"
            )}>
              {action.icon}
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fab flex items-center justify-center",
          "transition-transform duration-300",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
