import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight,
  Copy,
  Check,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function Dashboard() {
  const { accounts, creditCards, loans, goals, weeklyAdvice, discrepancies, applyAdvice, isLoading } = useFinanceData();
  const { signOut, user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalDebt = loans.reduce((sum, loan) => sum + Number(loan.balance), 0);
  const totalCardBalance = creditCards.reduce((sum, card) => sum + Number(card.balance), 0);
  const todaySpent = creditCards.reduce((sum, card) => sum + Number(card.today_spent || 0), 0);
  
  const overallGoalProgress = goals.length > 0
    ? Math.round((goals.reduce((sum, g) => sum + Number(g.current_amount), 0) / goals.reduce((sum, g) => sum + Number(g.target_amount), 0)) * 100)
    : 0;

  const unresolvedDiscrepancies = discrepancies.filter(d => !d.resolved);
  const unappliedAdvice = weeklyAdvice.filter(a => !a.applied);

  const handleCopyQuestion = async (id: string, question: string | null) => {
    if (!question) return;
    await navigator.clipboard.writeText(question);
    setCopiedId(id);
    toast.success("Question copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyAdvice = (id: string, title: string) => {
    applyAdvice.mutate(id);
    toast.success(`Applied: ${title}`, {
      description: "Your financial plan has been updated"
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Good morning</p>
          <h1 className="text-2xl font-bold mt-1">Your Financial Overview</h1>
        </div>
        <button 
          onClick={handleSignOut}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Main Balance Card */}
      <GlassCard elevated className="mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial opacity-50" />
        <div className="relative">
          <p className="text-muted-foreground text-sm mb-1">Total Assets</p>
          <div className="flex items-end gap-2">
            <AnimatedCounter 
              value={totalBalance} 
              prefix="$" 
              className="text-4xl font-bold gradient-text"
            />
          </div>
          {(totalDebt + totalCardBalance > 0) && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">Liabilities:</span>
                <span className="font-semibold text-destructive">${(totalDebt + totalCardBalance).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <GlassCard hover className="p-3">
          <p className="text-muted-foreground text-xs mb-1">Accounts</p>
          <AnimatedCounter value={totalBalance} prefix="$" className="text-xl font-bold" />
          <p className="text-muted-foreground text-xs mt-1">{accounts.length} accounts</p>
        </GlassCard>

        <GlassCard hover className="p-3">
          <p className="text-muted-foreground text-xs mb-1">Credit Cards</p>
          <AnimatedCounter value={totalCardBalance} prefix="$" className="text-xl font-bold" />
          <p className="text-muted-foreground text-xs mt-1">{creditCards.length} cards</p>
        </GlassCard>

        <GlassCard hover className="p-3">
          <p className="text-muted-foreground text-xs mb-1">Loans</p>
          <AnimatedCounter value={totalDebt} prefix="$" className="text-xl font-bold" />
          <p className="text-muted-foreground text-xs mt-1">{loans.length} active</p>
        </GlassCard>

        <GlassCard hover className="p-3 flex items-center gap-3">
          <div className="relative">
            <ProgressRing progress={overallGoalProgress} size={50} strokeWidth={5} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Goals</p>
            <p className="text-lg font-bold">{overallGoalProgress}%</p>
          </div>
        </GlassCard>
      </div>

      {/* Weekly Advisor Section */}
      {unappliedAdvice.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold">Weekly Advisor</h2>
          </div>
          
          <div className="space-y-3">
            {unappliedAdvice.slice(0, 3).map((advice, index) => (
              <GlassCard 
                key={advice.id} 
                className={cn(
                  "p-4 border-l-4",
                  index === 0 ? "border-l-primary" : "border-l-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm">{advice.title}</h3>
                  {advice.impact && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {advice.impact}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-3">{advice.description}</p>
                <button 
                  onClick={() => handleApplyAdvice(advice.id, advice.title)}
                  className="btn-premium text-sm py-2 px-4 w-full"
                >
                  Apply: {advice.action}
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Discrepancy Alerts */}
      {unresolvedDiscrepancies.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-warning flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Discrepancy Alerts</h2>
            <span className="ml-auto text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full">
              {unresolvedDiscrepancies.length} found
            </span>
          </div>

          <div className="space-y-3">
            {unresolvedDiscrepancies.map((discrepancy) => (
              <GlassCard key={discrepancy.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    discrepancy.severity === 'high' && "bg-destructive",
                    discrepancy.severity === 'medium' && "bg-warning",
                    discrepancy.severity === 'low' && "bg-muted-foreground"
                  )} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{discrepancy.title}</h3>
                    <p className="text-muted-foreground text-xs mb-3">{discrepancy.description}</p>
                    <button
                      onClick={() => handleCopyQuestion(discrepancy.id, discrepancy.question)}
                      className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      {copiedId === discrepancy.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied to clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy question for bank</span>
                        </>
                      )}
                    </button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Goals Preview */}
      {goals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Goals Progress</h2>
            <button className="text-xs text-primary flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {goals.map((goal) => {
              const progress = Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100);
              return (
                <GlassCard key={goal.id} hover className="min-w-[160px] p-4 flex-shrink-0">
                  <div className="text-2xl mb-2">{goal.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{goal.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ${Number(goal.current_amount).toLocaleString()} / ${Number(goal.target_amount).toLocaleString()}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {accounts.length === 0 && creditCards.length === 0 && goals.length === 0 && (
        <GlassCard className="p-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Welcome to The Auditor!</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start by adding your accounts, credit cards, and goals to get personalized financial insights.
          </p>
          <p className="text-xs text-muted-foreground">
            Use the + button below to get started.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
