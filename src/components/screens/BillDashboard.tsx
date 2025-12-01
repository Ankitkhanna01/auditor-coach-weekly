import { useState } from "react";
import { useBills, getDaysUntilDue, shouldShowReminder, Bill } from "@/hooks/useBills";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPermission } from "@/components/NotificationPermission";
import { BillCard } from "@/components/bills/BillCard";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { Receipt, AlertTriangle, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillDashboardProps {
  onBillClick?: (bill: Bill) => void;
  onContextChat?: (context: string) => void;
}

export function BillDashboard({ onBillClick, onContextChat }: BillDashboardProps) {
  const { bills, isLoading, markAsPaid, snoozeBill } = useBills();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState("");
  
  // Initialize notifications
  useNotifications(bills);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Sort bills by days until due
  const sortedBills = [...bills].sort((a, b) => {
    return getDaysUntilDue(a.next_due_date) - getDaysUntilDue(b.next_due_date);
  });

  // Get bills needing attention (due within 5 business days, not paid or snoozed)
  const urgentBills = sortedBills.filter(bill => {
    if (bill.is_paid) return false;
    if (bill.snoozed_until && new Date(bill.snoozed_until) > new Date()) return false;
    return shouldShowReminder(bill.next_due_date);
  });

  const handleContextClick = (context: string) => {
    if (onContextChat) {
      onContextChat(context);
    }
  };

  const handleFeedbackClick = (context: string) => {
    setFeedbackContext(context);
    setFeedbackOpen(true);
  };

  return (
    <div className="space-y-6 stagger-children pb-4">
      {/* Header - Clean 2025 style */}
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-display">Bills</h1>
          <p className="text-sm text-muted-foreground">
            {bills.length} {bills.length === 1 ? 'reminder' : 'reminders'} active
          </p>
        </div>
        <button
          onClick={() => handleFeedbackClick("General app feedback")}
          className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-all duration-300"
          aria-label="Send feedback"
        >
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Notification Permission */}
      <NotificationPermission />

      {/* Urgent Alert - Refined 2025 */}
      {urgentBills.length > 0 && (
        <button 
          className={cn(
            "w-full p-4 rounded-2xl",
            "bg-gradient-to-br from-warning/10 to-warning/5",
            "border border-warning/20",
            "flex items-center gap-4 text-left",
            "transition-all duration-300 hover:border-warning/30"
          )}
          onClick={() => handleContextClick(`You have ${urgentBills.length} urgent bill${urgentBills.length > 1 ? 's' : ''}: ${urgentBills.map(b => b.name).join(', ')}. What would you like to do?\n• Update bill details\n• Delete a bill`)}
        >
          <div className="p-2.5 rounded-xl bg-warning/15">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-warning">
              {urgentBills.length} due soon
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {urgentBills.map(b => b.name).join(' · ')}
            </p>
          </div>
        </button>
      )}

      {/* Bills Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-label">Upcoming</h2>
          <span className="text-xs text-muted-foreground">{sortedBills.length} bills</span>
        </div>
        
        {bills.length === 0 ? (
          <button 
            className={cn(
              "w-full p-8 rounded-2xl",
              "bento-card",
              "flex flex-col items-center gap-4 text-center",
              "transition-all duration-300"
            )}
            onClick={() => handleContextClick("You don't have any bills yet. Would you like me to help you add your first bill? Just tell me about it!")}
          >
            <div className="p-4 rounded-2xl bg-muted/30">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Add your first bill</p>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Tap to start tracking your payments
              </p>
            </div>
          </button>
        ) : (
          <div className="space-y-3">
            {sortedBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onMarkPaid={markAsPaid}
                onSnooze={(billId, snoozeUntil) => snoozeBill({ billId, snoozeUntil })}
                onBillClick={onBillClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen}
        context={feedbackContext}
      />
    </div>
  );
}
