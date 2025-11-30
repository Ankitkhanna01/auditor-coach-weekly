import { useBills, getDaysUntilDue, shouldShowReminder } from "@/hooks/useBills";
import { useNotifications } from "@/hooks/useNotifications";
import { GlassCard } from "@/components/ui/GlassCard";
import { NotificationPermission } from "@/components/NotificationPermission";
import { BillCard } from "@/components/bills/BillCard";
import { Receipt, Bell, Calendar, AlertTriangle, List } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export function BillDashboard() {
  const { bills, isLoading, markAsPaid, snoozeBill } = useBills();
  
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
          sortedBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onMarkPaid={markAsPaid}
              onSnooze={(billId, snoozeUntil) => snoozeBill({ billId, snoozeUntil })}
            />
          ))
        )}
      </div>

      {/* Bill Schedule Table */}
      {bills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Bill Schedule</h2>
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
                    <TableRow key={bill.id} className="border-border/30">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className={bill.is_paid ? "line-through text-muted-foreground" : ""}>
                            {bill.name}
                          </span>
                          {bill.last_four_digits && (
                            <span className="text-xs text-muted-foreground">
                              •••• {bill.last_four_digits}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={
                            bill.is_paid ? "text-primary" :
                            daysUntil <= 3 ? "text-destructive font-medium" :
                            daysUntil <= 7 ? "text-warning" : ""
                          }>
                            {bill.is_paid ? "Paid ✓" : format(new Date(bill.next_due_date), "MMM d, yyyy")}
                          </span>
                          {!bill.is_paid && (
                            <span className="text-xs text-muted-foreground">
                              {daysUntil === 0 ? "Today" :
                               daysUntil === 1 ? "Tomorrow" :
                               daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                               `in ${daysUntil} days`}
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

      {/* Info Card */}
      <GlassCard className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Smart Reminders</p>
            <p className="text-xs text-muted-foreground">
              Tap a bill to mark as paid or snooze notifications
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
