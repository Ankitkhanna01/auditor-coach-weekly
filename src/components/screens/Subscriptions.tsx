import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  Tv,
  Dumbbell,
  Smartphone,
  Music,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Trash2,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, typeof Tv> = {
  streaming: Tv,
  fitness: Dumbbell,
  utilities: Smartphone,
  software: Music,
  other: AlertTriangle,
};

const categoryColors: Record<string, string> = {
  streaming: 'from-red-500 to-pink-500',
  fitness: 'from-green-500 to-emerald-500',
  utilities: 'from-blue-500 to-cyan-500',
  software: 'from-purple-500 to-violet-500',
  other: 'from-gray-500 to-slate-500',
};

export function Subscriptions() {
  const { subscriptions, deleteSubscription, isLoading } = useFinanceData();
  
  const totalMonthly = subscriptions.reduce((sum, sub) => 
    sum + (sub.billing_cycle === 'yearly' ? Number(sub.cost) / 12 : Number(sub.cost)), 0
  );
  const totalYearly = totalMonthly * 12;

  // Mock alternatives for cost comparison
  const alternatives = [
    { 
      current: 'Phone Plan', 
      currentCost: 60, 
      alternative: 'Koodo', 
      alternativeCost: 45, 
      savings: 15 
    },
    { 
      current: 'Netflix + Spotify', 
      currentCost: 22, 
      alternative: 'Bundle Deal', 
      alternativeCost: 15, 
      savings: 7 
    },
  ];

  const handleDelete = (id: string) => {
    deleteSubscription.mutate(id);
  };

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
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground text-sm">Track recurring costs</p>
      </div>

      {/* Total Cost */}
      <GlassCard elevated className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial opacity-40" />
        <div className="relative">
          <p className="text-muted-foreground text-sm mb-1">Monthly Subscriptions</p>
          <AnimatedCounter 
            value={totalMonthly} 
            prefix="$" 
            className="text-3xl font-bold"
          />
          <p className="text-sm text-muted-foreground mt-2">
            ${totalYearly.toFixed(0)}/year across {subscriptions.length} subscriptions
          </p>
        </div>
      </GlassCard>

      {/* Subscriptions List */}
      <div className="space-y-3 mb-6">
        {subscriptions.map((sub) => {
          const Icon = categoryIcons[sub.category || 'other'] || AlertTriangle;
          const daysUntilDue = sub.due_date 
            ? Math.ceil((new Date(sub.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <GlassCard key={sub.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  categoryColors[sub.category || 'other'] || categoryColors.other
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold">{sub.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{sub.billing_cycle}</span>
                    {daysUntilDue !== null && (
                      <>
                        <span>•</span>
                        <span className={cn(
                          daysUntilDue <= 3 && "text-warning font-medium"
                        )}>
                          {daysUntilDue <= 0 ? 'Due today' : `Due in ${daysUntilDue} days`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cost & Delete */}
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-bold">${sub.cost}</p>
                    <p className="text-xs text-muted-foreground">/{sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(sub.id)}
                    className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}

        {subscriptions.length === 0 && (
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="font-medium mb-2">No subscriptions yet</p>
            <p className="text-muted-foreground text-sm">
              Use the chat to add subscriptions or recurring bills
            </p>
          </GlassCard>
        )}
      </div>

      {/* Duplicate Detection */}
      {subscriptions.length >= 2 && (
        <GlassCard className="p-4 mb-6 border-l-4 border-l-warning">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold">Potential Duplicate</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You have multiple streaming services. Consider a bundle deal for streaming services.
          </p>
          <button className="text-sm text-primary flex items-center gap-1">
            See alternatives <ChevronRight className="w-3 h-3" />
          </button>
        </GlassCard>
      )}

      {/* Cost Savings */}
      {subscriptions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold">Save Money</h2>
          </div>

          <div className="space-y-3">
            {alternatives.map((alt, index) => (
              <GlassCard key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{alt.current}</p>
                    <p className="text-xs text-muted-foreground">
                      Switch to {alt.alternative}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-muted-foreground line-through">${alt.currentCost}</span>
                      <span className="text-success font-bold ml-2">${alt.alternativeCost}</span>
                    </p>
                    <p className="text-xs text-success font-medium">Save ${alt.savings}/mo</p>
                  </div>
                </div>
                <button className="btn-premium text-sm py-2 px-4 w-full">
                  Compare Plans
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}