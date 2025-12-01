import { useState } from "react";
import { Bill, getDaysUntilDue, shouldShowReminder } from "@/hooks/useBills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CreditCard, Zap, Home, Tv, Car, Shield, Receipt,
  Check, Clock, ChevronRight, CalendarIcon, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
  credit_card: "from-violet-500/80 to-purple-600/80",
  utility: "from-amber-500/80 to-orange-600/80",
  rent: "from-emerald-500/80 to-green-600/80",
  subscription: "from-pink-500/80 to-rose-600/80",
  loan: "from-blue-500/80 to-cyan-600/80",
  insurance: "from-indigo-500/80 to-blue-600/80",
  other: "from-slate-500/80 to-slate-600/80",
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
  onMarkPaid: (billId: string) => void;
  onSnooze: (billId: string, snoozeUntil: Date) => void;
  onBillClick?: (bill: Bill) => void;
}

export function BillCard({ bill, onMarkPaid, onSnooze, onBillClick }: BillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState("12:00");
  const [isLoading, setIsLoading] = useState(false);
  
  const Icon = typeIcons[bill.type] || Receipt;
  const colorClass = typeColors[bill.type] || typeColors.other;
  const daysUntil = getDaysUntilDue(bill.next_due_date);
  const isUrgent = shouldShowReminder(bill.next_due_date);
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
      setShowCustom(false);
      setExpanded(false);
    }
  };
  
  const handleCustomSnooze = async () => {
    if (!customDate) return;
    
    setIsLoading(true);
    try {
      const [hours, minutes] = customTime.split(":").map(Number);
      const snoozeUntil = new Date(customDate);
      snoozeUntil.setHours(hours, minutes, 0, 0);
      await onSnooze(bill.id, snoozeUntil);
    } finally {
      setIsLoading(false);
      setSnoozeOpen(false);
      setShowCustom(false);
      setCustomDate(undefined);
      setExpanded(false);
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    setSnoozeOpen(open);
    if (!open) {
      setShowCustom(false);
      setCustomDate(undefined);
    }
  };

  const handleBillInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBillClick) {
      onBillClick(bill);
    }
  };

  // Days text formatting
  const getDaysText = () => {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    return `${daysUntil}d`;
  };

  const getDaysColor = () => {
    if (daysUntil <= 3) return "text-destructive";
    if (daysUntil <= 7) return "text-warning";
    return "text-muted-foreground";
  };
  
  return (
    <>
      <div
        className={cn(
          "rounded-2xl transition-all duration-300",
          "bg-gradient-to-br from-card/80 to-card/40",
          "border border-border/50",
          isUrgent && !isSnoozed && "border-warning/30",
          isSnoozed && "opacity-60"
        )}
      >
        {/* Main Row */}
        <button 
          className="w-full p-4 flex items-center gap-4 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Icon */}
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br shrink-0",
            colorClass
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Bill Info */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate text-[15px]">
                {bill.name}
              </p>
              {bill.last_four_digits && (
                <span className="text-[10px] font-medium bg-muted/60 px-1.5 py-0.5 rounded-md shrink-0">
                  {bill.last_four_digits}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSnoozed ? (
                <>Snoozed · {format(new Date(bill.snoozed_until!), "MMM d, h:mm a")}</>
              ) : (
                <>
                  {format(new Date(bill.next_due_date), "MMM d")}
                  {bill.amount && <span className="ml-1.5">· ${bill.amount.toLocaleString()}</span>}
                </>
              )}
            </p>
          </div>

          {/* Days Badge */}
          {!isSnoozed && (
            <div className={cn(
              "px-3 py-1.5 rounded-xl text-sm font-semibold shrink-0",
              daysUntil <= 3 ? "bg-destructive/15 text-destructive" :
              daysUntil <= 7 ? "bg-warning/15 text-warning" :
              "bg-muted/40 text-muted-foreground"
            )}>
              {getDaysText()}
            </div>
          )}

          {isSnoozed && (
            <div className="p-2 rounded-lg bg-muted/30">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </button>

        {/* Expanded Section */}
        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            <div className="h-px bg-border/50" />
            
            {/* Schedule Grid - Minimal */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next</p>
                <p className="text-sm font-medium">{format(new Date(bill.next_due_date), "MMM d")}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cycle</p>
                <p className="text-sm font-medium capitalize">{bill.frequency || 'Monthly'}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Days</p>
                <p className={cn("text-sm font-medium", getDaysColor())}>{getDaysText()}</p>
              </div>
            </div>

            {bill.paid_at && (
              <div className="text-center py-2 px-3 rounded-xl bg-primary/10">
                <p className="text-xs text-primary font-medium">
                  Paid {format(new Date(bill.paid_at), "MMM d, yyyy")}
                </p>
              </div>
            )}

            {/* Actions - Clean 2025 style */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-11 rounded-xl gap-2 font-medium"
                onClick={handleMarkPaid}
                disabled={isLoading}
              >
                <Check className="w-4 h-4" />
                Mark Paid
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-11 rounded-xl gap-2 font-medium"
                onClick={() => setSnoozeOpen(true)}
                disabled={isLoading}
              >
                <Clock className="w-4 h-4" />
                Snooze
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 px-3 rounded-xl"
                onClick={() => onBillClick?.(bill)}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Snooze Dialog - Clean 2025 style */}
      <Dialog open={snoozeOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Snooze</DialogTitle>
          </DialogHeader>
          
          {!showCustom ? (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-muted-foreground mb-4">
                Pause reminders for "{bill.name}"
              </p>
              {snoozeOptions.map((option) => (
                <Button
                  key={option.hours}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 rounded-xl"
                  onClick={() => handleSnooze(option.hours)}
                  disabled={isLoading}
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {option.label}
                </Button>
              ))}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground h-12 rounded-xl"
                  onClick={() => setShowCustom(true)}
                  disabled={isLoading}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Custom date & time
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground -ml-2"
                onClick={() => setShowCustom(false)}
              >
                ← Back
              </Button>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 rounded-xl",
                        !customDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Time</Label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full h-12 rounded-xl"
                />
              </div>
              
              <Button
                className="w-full h-12 rounded-xl"
                onClick={handleCustomSnooze}
                disabled={isLoading || !customDate}
              >
                {isLoading ? "Setting..." : "Set Snooze"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
