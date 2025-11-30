import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Wallet, 
  CreditCard, 
  Home, 
  Receipt, 
  Target,
  ShoppingCart,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  reason: string;
  enabled: boolean;
}

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'accounts',
      icon: <Wallet className="w-6 h-6" />,
      title: 'Accounts & Investments',
      description: 'Track balances and optimize ROI',
      reason: 'See where your money is and how to make it grow efficiently.',
      enabled: true
    },
    {
      id: 'cards',
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Credit Cards',
      description: 'Track spending and cashback',
      reason: 'Maximize rewards and detect billing discrepancies.',
      enabled: true
    },
    {
      id: 'loans',
      icon: <Home className="w-6 h-6" />,
      title: 'Loans & Mortgages',
      description: 'Track payments and optimize allocations',
      reason: 'Reduce interest costs and manage repayment vs savings.',
      enabled: true
    },
    {
      id: 'subscriptions',
      icon: <Receipt className="w-6 h-6" />,
      title: 'Subscriptions & Bills',
      description: 'Track recurring costs',
      reason: 'Find better deals and avoid unnecessary payments.',
      enabled: true
    },
    {
      id: 'transactions',
      icon: <ShoppingCart className="w-6 h-6" />,
      title: 'Daily Transactions',
      description: 'Track everyday spending',
      reason: 'See spending patterns and optimize goal contributions.',
      enabled: false
    },
    {
      id: 'goals',
      icon: <Target className="w-6 h-6" />,
      title: 'Goals',
      description: 'Track savings goals',
      reason: 'Make sure you hit your targets on time.',
      enabled: true
    },
  ]);

  const toggleModule = (id: string) => {
    setModules(modules.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      {/* Logo & Header */}
      <div className="text-center mb-8 pt-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon animate-float">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">The Auditor</h1>
        <p className="text-muted-foreground">Your Personal Financial Coach</p>
      </div>

      {/* Module Selection */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-4">Choose what to track</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select the modules you want to use. You can always change this later.
        </p>

        <div className="space-y-3">
          {modules.map((module) => (
            <GlassCard 
              key={module.id}
              hover
              onClick={() => toggleModule(module.id)}
              className={cn(
                "p-4 cursor-pointer transition-all duration-300",
                module.enabled && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  module.enabled 
                    ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {module.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{module.title}</h3>
                    {/* Toggle */}
                    <div className={cn(
                      "w-12 h-6 rounded-full p-1 transition-all",
                      module.enabled ? "bg-primary" : "bg-muted"
                    )}>
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform",
                        module.enabled && "translate-x-6"
                      )} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  {module.enabled && (
                    <p className="text-xs text-primary mt-2 animate-fade-in">
                      💡 {module.reason}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-6 mb-4">
        <GlassCard className="p-4 border-l-4 border-l-primary">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">🔒 Your data stays private.</span> Everything is stored locally on your device. We never send your financial data to external servers.
          </p>
        </GlassCard>
      </div>

      {/* CTA */}
      <button 
        onClick={onComplete}
        className="btn-premium w-full flex items-center justify-center gap-2"
      >
        <span>Create my workspace</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
