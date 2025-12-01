import { useState } from "react";
import { useBills, getDaysUntilDue, shouldShowReminder, Bill } from "@/hooks/useBills";
import { useNotifications } from "@/hooks/useNotifications";
import { GlassCard } from "@/components/ui/GlassCard";
import { NotificationPermission } from "@/components/NotificationPermission";
import { BillCard } from "@/components/bills/BillCard";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { Receipt, Bell, Calendar, AlertTriangle, List, Sparkles, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface BillDashboardProps {
  onBillClick?: (bill: Bill) => void;
  onContextChat?: (context: string) => void;
}

export function BillDashboard({ onBillClick, onContextChat }: BillDashboardProps) {
  const { bills, isLoading, markAsPaid, snoozeBill } = useBills();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState("");
  
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

  // Get bills needing attention (due within 5 business days, not paid or snoozed)
  const urgentBills = sortedBills.filter(bill => {
    if (bill.is_paid) return false;
    if (bill.snoozed_until && new Date(bill.snoozed_until) > new Date()) return false;
    return shouldShowReminder(bill.next_due_date);
  });

  const handleTableRowClick = (bill: Bill) => {
    if (onBillClick) {
      onBillClick(bill);
    }
  };

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
    <div className="space-y-6 stagger-children">
      {/* Header - Feedback only (not AI changeable) */}
      <div className="space-y-1">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleFeedbackClick("App title: 'Bill Reminders'")}
        >
          <h1 className="text-2xl font-bold gradient-text">Bill Reminders</h1>
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        </div>
        <p 
          className="text-sm text-muted-foreground cursor-pointer hover:opacity-80"
          onClick={() => handleFeedbackClick("App tagline: 'Never miss a payment again'")}
        >
          Never miss a payment again
        </p>
      </div>

      {/* Notification Permission Prompt */}
      <NotificationPermission />

      {/* Urgent Bills Alert - AI clickable */}
      {urgentBills.length > 0 && (
        <GlassCard 
          className="p-4 border-warning/30 bg-warning/5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleContextClick(`You have ${urgentBills.length} urgent bill${urgentBills.length > 1 ? 's' : ''}: ${urgentBills.map(b => b.name).join(', ')}. What would you like to do?\n• Mark them as paid\n• Snooze reminders\n• See details`)}
        >
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
            <Sparkles className="w-4 h-4 text-warning/50" />
          </div>
        </GlassCard>
      )}

      {/* Summary Card - AI clickable */}
      <GlassCard 
        className="p-5 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => handleContextClick(`You're tracking ${bills.length} bill${bills.length !== 1 ? 's' : ''}. What would you like to do?\n• Add a new bill\n• See payment summary\n• Export bill data`)}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Bills Tracked</p>
            <p className="text-3xl font-bold gradient-text">{bills.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          <span>Tap to chat</span>
        </div>
      </GlassCard>

      {/* Bills List */}
      <div className="space-y-3">
        <h2 
          className="text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-2"
          onClick={() => handleContextClick("You tapped on 'Upcoming Bills'. What would you like to do?\n• Add a new bill\n• Sort bills differently\n• Filter by type")}
        >
          Upcoming Bills
          <Sparkles className="w-3 h-3 text-muted-foreground" />
        </h2>
        
        {bills.length === 0 ? (
          <GlassCard 
            className="p-8 text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleContextClick("You don't have any bills yet. Would you like me to help you add your first bill? Just tell me about it!")}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-muted/30">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No bills yet</p>
                <p className="text-sm text-muted-foreground">
                  Tap here to add your first bill
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          sortedBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onMarkPaid={markAsPaid}
              onSnooze={(billId, snoozeUntil) => snoozeBill({ billId, snoozeUntil })}
              onBillClick={onBillClick}
            />
          ))
        )}
      </div>

      {/* Bill Schedule Table */}
      {bills.length > 0 && (
        <div className="space-y-3">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleContextClick("You tapped on 'Bill Schedule'. What would you like to do?\n• See calendar view\n• Export schedule\n• Change display format")}
          >
            <List className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Bill Schedule</h2>
            <Sparkles className="w-3 h-3 text-muted-foreground" />
          </div>
          
          <GlassCard className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Bill</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground text-right">Frequency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBills.map((bill) => {
                  const daysUntil = getDaysUntilDue(bill.next_due_date);
                  return (
                    <TableRow 
                      key={bill.id} 
                      className="border-border/30 cursor-pointer hover:bg-muted/30"
                      onClick={() => handleTableRowClick(bill)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-2">
                            {bill.name}
                            {bill.last_four_digits && (
                              <span className="text-xs font-normal bg-muted/50 px-1.5 py-0.5 rounded">
                                {bill.last_four_digits}
                              </span>
                            )}
                          </span>
                          {bill.paid_at && (
                            <span className="text-xs text-primary">
                              Paid {format(new Date(bill.paid_at), "MMM d")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={
                            daysUntil <= 3 ? "text-destructive font-medium" :
                            daysUntil <= 7 ? "text-warning" : ""
                          }>
                            {format(new Date(bill.next_due_date), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {daysUntil === 0 ? "Today" :
                             daysUntil === 1 ? "Tomorrow" :
                             daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                             `in ${daysUntil} days`}
                          </span>
                          {/* Show last due date - one cycle before */}
                          {bill.frequency === 'monthly' && (
                            <span className="text-xs text-muted-foreground/70 mt-0.5">
                              Last due: {format(
                                new Date(new Date(bill.next_due_date).setMonth(new Date(bill.next_due_date).getMonth() - 1)),
                                "MMM d"
                              )}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right capitalize text-muted-foreground">
                        {bill.frequency || 'monthly'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      )}

      {/* Feedback Card - Sends to owner */}
      <GlassCard 
        className="p-4 bg-secondary/30 border-secondary/50 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => handleFeedbackClick("General app feedback")}
      >
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-secondary-foreground mt-0.5" />
          <div>
            <p className="font-medium text-sm">Send Feedback</p>
            <p className="text-xs text-muted-foreground">
              Suggest changes to the app owner
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Info Card */}
      <GlassCard 
        className="p-4 bg-primary/5 border-primary/20 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => handleContextClick("You tapped on 'Tap Any Element'. Everything on this page is interactive! Just tap on anything and I'll help you with it. What would you like to know or change?")}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Tap Any Element</p>
            <p className="text-xs text-muted-foreground">
              ✨ = Chat with AI | 💬 = Send feedback to owner
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen}
        context={feedbackContext}
      />
    </div>
  );
}