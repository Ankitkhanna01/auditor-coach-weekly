import { useState } from "react";
import { Bill, getDaysUntilDue, shouldShowReminder } from "@/hooks/useBills";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, Zap, Home, Tv, Car, Shield, Receipt, Bell, 
  Check, Clock, ChevronDown, ChevronUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const snoozeOptions = [
  { label: "1 hour", hours: 1 },
  { label: "4 hours", hours: 4 },
  { label: "Tomorrow", hours: 24 },
  { label: "2 days", hours: 48 },
  { label: "1 week", hours: 168 },
];

interface BillCardProps {
  bill: Bill;
  onMarkPaid: (billId: string) => Promise<void>;
  onSnooze: (billId: string, snoozeUntil: Date) => Promise<void>;
}

export function BillCard({ bill, onMarkPaid, onSnooze }: BillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const Icon = typeIcons[bill.type] || Receipt;
  const colorClass = typeColors[bill.type] || typeColors.other;
  const daysUntil = getDaysUntilDue(bill.next_due_date);
  const isUrgent = shouldShowReminder(bill.next_due_date);
  const isPaid = bill.is_paid;
  const isSnoozed = bill.snoozed_until && new Date(bill.snoozed_until) > new Date();
  
  const handleMarkPaid = async () => {
    setIsLoading(true);
    try {
      await onMarkPaid(bill.id);
    } finally {
      setIsLoading(false);
      setExpanded(false);
    }
  };
  
  const handleSnooze = async (hours: number) => {
    setIsLoading(true);
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + hours);
      await onSnooze(bill.id, snoozeUntil);
    } finally {
      setIsLoading(false);
      setSnoozeOpen(false);
      setExpanded(false);
    }
  };
  
  return (
    <>
      <GlassCard
        className={cn(
          "p-4 transition-all duration-200",
          isUrgent && !isPaid && !isSnoozed && "border-warning/30 pulse-neon",
          isPaid && "opacity-60 border-primary/30",
          isSnoozed && "opacity-75 border-muted/30"
        )}
      >
        <div 
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Icon */}
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br relative",
            colorClass,
            isPaid && "opacity-50"
          )}>
            <Icon className="w-5 h-5 text-white" />
            {isPaid && (
              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {isSnoozed && !isPaid && (
              <div className="absolute -top-1 -right-1 bg-muted rounded-full p-0.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Bill Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                "font-semibold truncate",
                isPaid && "line-through text-muted-foreground"
              )}>
                {bill.name}
              </p>
              {bill.last_four_digits && (
                <span className="text-xs text-muted-foreground">
                  •••• {bill.last_four_digits}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isPaid ? (
                <span className="text-primary">Paid ✓</span>
              ) : isSnoozed ? (
                <span className="text-muted-foreground">
                  Snoozed until {new Date(bill.snoozed_until!).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              ) : (
                <>
                  Due: {new Date(bill.next_due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                  {bill.amount && (
                    <span className="ml-2">
                      · ~${bill.amount.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Days Until / Expand */}
          <div className="text-right flex items-center gap-2">
            {!isPaid && !isSnoozed && (
              <div>
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
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded Actions */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
            {!isPaid && (
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleMarkPaid}
                disabled={isLoading}
              >
                <Check className="w-4 h-4" />
                Mark Paid
              </Button>
            )}
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setSnoozeOpen(true)}
                disabled={isLoading}
              >
                <Clock className="w-4 h-4" />
                Snooze
              </Button>
            )}
            {isPaid && (
              <p className="text-sm text-muted-foreground text-center w-full">
                This bill is marked as paid for this cycle
              </p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Snooze Dialog */}
      <Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Snooze Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              How long would you like to snooze reminders for "{bill.name}"?
            </p>
            {snoozeOptions.map((option) => (
              <Button
                key={option.hours}
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => handleSnooze(option.hours)}
                disabled={isLoading}
              >
                <Clock className="w-4 h-4" />
                {option.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}