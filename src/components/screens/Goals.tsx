import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  Calendar,
  Sparkles,
  Target,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground'
};

export function Goals() {
  const { goals, contributeToGoal, isLoading } = useFinanceData();
  
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  const calculateMonthlyNeeded = (goal: typeof goals[0]) => {
    const targetDate = new Date(goal.target_date || new Date());
    const today = new Date();
    const monthsLeft = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    return Math.ceil(remaining / monthsLeft);
  };

  const calculateProjectedDate = (goal: typeof goals[0], monthlyContribution: number) => {
    if (monthlyContribution <= 0) return 'Never';
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    const monthsNeeded = Math.ceil(remaining / monthlyContribution);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);
    return projectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleContribute = (goalId: string, amount: number) => {
    contributeToGoal.mutate({ id: goalId, amount });
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
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-muted-foreground text-sm">Track your dreams</p>
      </div>

      {/* Overall Progress */}
      <GlassCard elevated className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial opacity-40" />
        <div className="flex items-center gap-6">
          <ProgressRing progress={overallProgress} size={100} strokeWidth={8} />
          <div>
            <p className="text-muted-foreground text-sm mb-1">Overall Progress</p>
            <AnimatedCounter 
              value={totalCurrent} 
              prefix="$" 
              className="text-2xl font-bold"
            />
            <p className="text-sm text-muted-foreground">
              of ${totalTarget.toLocaleString()} total
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100);
          const monthlyNeeded = calculateMonthlyNeeded(goal);
          const projectedDate = calculateProjectedDate(goal, monthlyNeeded * 0.8);

          return (
            <GlassCard key={goal.id} className="p-0 overflow-hidden">
              <div className="p-4">
                {/* Goal Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{goal.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                      <span className={cn(
                        "text-xs font-medium",
                        priorityColors[goal.priority || 'medium']
                      )}>
                        {goal.priority} priority
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Target: {goal.target_date 
                          ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold">${Number(goal.current_amount).toLocaleString()}</span>
                    <span className="text-muted-foreground">${Number(goal.target_amount).toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all duration-1000 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{progress}% funded</span>
                    <span>${(Number(goal.target_amount) - Number(goal.current_amount)).toLocaleString()} remaining</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Monthly needed</p>
                    <p className="font-semibold">${monthlyNeeded}/mo</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Projected date</p>
                    <p className="font-semibold">{projectedDate}</p>
                  </div>
                </div>
              </div>

              {/* Quick Add */}
              <div className="border-t border-border p-3 flex gap-2">
                {[25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleContribute(goal.id, amount)}
                    className="flex-1 py-2 text-sm font-medium glass-card hover:bg-muted/50 transition-colors"
                  >
                    +${amount}
                  </button>
                ))}
                <button className="px-4 py-2 text-sm font-medium bg-gradient-primary rounded-lg text-primary-foreground shadow-glow">
                  Custom
                </button>
              </div>
            </GlassCard>
          );
        })}

        {goals.length === 0 && (
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="font-medium mb-2">No goals yet</p>
            <p className="text-muted-foreground text-sm">
              Use the chat to add savings goals like "Emergency fund" or "Vacation"
            </p>
          </GlassCard>
        )}
      </div>

      {/* Smart Suggestion */}
      {goals.length > 0 && (
        <GlassCard className="mt-6 p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Smart Suggestion</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on your spending patterns, you could reach your goals faster by 
            reducing dining out by $40/week and redirecting to savings.
          </p>
          <button className="btn-premium text-sm py-2 px-4 mt-3">
            Apply This Strategy
          </button>
        </GlassCard>
      )}
    </div>
  );
}