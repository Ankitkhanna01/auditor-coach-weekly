import { useBills, getDaysUntilDue, shouldShowReminder } from "@/hooks/useBills";
import { useNotifications } from "@/hooks/useNotifications";
import { GlassCard } from "@/components/ui/GlassCard";
import { NotificationPermission } from "@/components/NotificationPermission";
import { CreditCard, Zap, Home, Tv, Car, Shield, Receipt, Bell, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof CreditCard> = {
  credit_card: CreditCard,
  utility: Zap,
  rent: Home,
  subscription: Tv,
  loan: Car,
  insurance: Shield,
  other: Receipt,
};

const typeColors: Record<string, string> = {
  credit_card: "from-violet-500 to-purple-600",
  utility: "from-amber-500 to-orange-600",
  rent: "from-emerald-500 to-green-600",
  subscription: "from-pink-500 to-rose-600",
  loan: "from-blue-500 to-cyan-600",
  insurance: "from-indigo-500 to-blue-600",
  other: "from-gray-500 to-slate-600",
};

export function BillDashboard() {
  const { bills, isLoading } = useBills();
  
  // Initialize notifications - this will check and send notifications when bills load
  useNotifications(bills);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sort bills by days until due
  const sortedBills = [...bills].sort((a, b) => {
    return getDaysUntilDue(a.next_due_date) - getDaysUntilDue(b.next_due_date);
  });

  // Get bills needing attention (due within 5 business days)
  const urgentBills = sortedBills.filter(bill => shouldShowReminder(bill.next_due_date));

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold gradient-text">Bill Reminders</h1>
        <p className="text-sm text-muted-foreground">
          Never miss a payment again
        </p>
      </div>

      {/* Notification Permission Prompt */}
      <NotificationPermission />

      {/* Urgent Bills Alert */}
      {urgentBills.length > 0 && (
        <GlassCard className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-warning">
                {urgentBills.length} bill{urgentBills.length > 1 ? 's' : ''} due soon!
              </p>
              <p className="text-xs text-muted-foreground">
                {urgentBills.map(b => b.name).join(', ')}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Summary Card */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Bills Tracked</p>
            <p className="text-3xl font-bold gradient-text">{bills.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
        </div>
      </GlassCard>

      {/* Bills List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming Bills</h2>
        
        {bills.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-muted/30">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No bills yet</p>
                <p className="text-sm text-muted-foreground">
                  Use the chat to add your first bill
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          sortedBills.map((bill) => {
            const Icon = typeIcons[bill.type] || Receipt;
            const colorClass = typeColors[bill.type] || typeColors.other;
            const daysUntil = getDaysUntilDue(bill.next_due_date);
            const isUrgent = shouldShowReminder(bill.next_due_date);
            
            return (
              <GlassCard
                key={bill.id}
                className={cn(
                  "p-4 card-hover",
                  isUrgent && "border-warning/30 pulse-neon"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "p-3 rounded-xl bg-gradient-to-br",
                    colorClass
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Bill Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{bill.name}</p>
                      {bill.last_four_digits && (
                        <span className="text-xs text-muted-foreground">
                          •••• {bill.last_four_digits}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(bill.next_due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                      {bill.amount && (
                        <span className="ml-2">
                          · ~${bill.amount.toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Days Until */}
                  <div className="text-right">
                    {isUrgent && (
                      <Bell className="w-4 h-4 text-warning mb-1 ml-auto animate-pulse" />
                    )}
                    <p className={cn(
                      "text-lg font-bold",
                      daysUntil <= 3 ? "text-destructive" :
                      daysUntil <= 7 ? "text-warning" :
                      "text-muted-foreground"
                    )}>
                      {daysUntil === 0 ? "Today" :
                       daysUntil === 1 ? "Tomorrow" :
                       `${daysUntil} days`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Info Card */}
      <GlassCard className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Automatic Reminders</p>
            <p className="text-xs text-muted-foreground">
              Bills are highlighted 5 business days before they're due
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
