import { useState } from "react";
import { useBills, getDaysUntilDue, shouldShowReminder, Bill } from "@/hooks/useBills";
import { useNotifications } from "@/hooks/useNotifications";
import { GlassCard } from "@/components/ui/GlassCard";
import { NotificationPermission } from "@/components/NotificationPermission";
import { BillCard } from "@/components/bills/BillCard";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { Receipt, AlertTriangle, Sparkles, MessageSquare } from "lucide-react";

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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
    <div className="space-y-5 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text">Bill Reminders</h1>
          <p className="text-xs text-muted-foreground">
            {bills.length} bill{bills.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button
          onClick={() => handleFeedbackClick("General app feedback")}
          className="p-2 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors"
          aria-label="Send feedback"
        >
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Notification Permission */}
      <NotificationPermission />

      {/* Urgent Alert - Only show if bills need attention */}
      {urgentBills.length > 0 && (
        <GlassCard 
          className="p-3 border-warning/30 bg-warning/5 cursor-pointer"
          onClick={() => handleContextClick(`You have ${urgentBills.length} urgent bill${urgentBills.length > 1 ? 's' : ''}: ${urgentBills.map(b => b.name).join(', ')}. What would you like to do?\n• Update bill details\n• Delete a bill`)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-warning">
                {urgentBills.length} bill{urgentBills.length > 1 ? 's' : ''} due soon
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {urgentBills.map(b => b.name).join(', ')}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Bills Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 
            className="text-base font-semibold cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-2"
            onClick={() => handleContextClick("You tapped on 'Upcoming Bills'. What would you like to do?\n• Add a new bill\n• Update an existing bill\n• Delete a bill")}
          >
            Upcoming Bills
            <Sparkles className="w-3 h-3 text-muted-foreground" />
          </h2>
        </div>
        
        {bills.length === 0 ? (
          <GlassCard 
            className="p-6 text-center cursor-pointer"
            onClick={() => handleContextClick("You don't have any bills yet. Would you like me to help you add your first bill? Just tell me about it!")}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted/30">
                <Receipt className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">No bills yet</p>
                <p className="text-xs text-muted-foreground">
                  Tap to add your first bill
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2">
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
      </div>

      {/* Help hint - minimal */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 pt-2">
        <Sparkles className="w-3 h-3" />
        <span>Tap any bill to chat with AI</span>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen}
        context={feedbackContext}
      />
    </div>
  );
}
