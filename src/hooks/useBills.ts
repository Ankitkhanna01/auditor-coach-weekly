import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/**
 * Calculate the next due date based on due_day and frequency.
 * This is a simple, predictable calculation - same day each month/week/year.
 */
function calculateNextDueDate(dueDay: number, frequency: BillFrequency = 'monthly', fromDate?: Date): string {
  const today = fromDate || new Date();
  today.setHours(0, 0, 0, 0);
  
  let nextDue: Date;
  
  switch (frequency) {
    case 'weekly': {
      const currentDayOfWeek = today.getDay();
      const targetDay = dueDay % 7;
      let daysUntil = targetDay - currentDayOfWeek;
      if (daysUntil <= 0) daysUntil += 7;
      nextDue = new Date(today);
      nextDue.setDate(today.getDate() + daysUntil);
      break;
    }
    case 'biweekly': {
      const currentDayOfWeek = today.getDay();
      const targetDay = dueDay % 7;
      let daysUntil = targetDay - currentDayOfWeek;
      if (daysUntil <= 0) daysUntil += 14;
      else if (daysUntil < 7) daysUntil += 7;
      nextDue = new Date(today);
      nextDue.setDate(today.getDate() + daysUntil);
      break;
    }
    case 'yearly': {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      nextDue = new Date(currentYear, currentMonth, dueDay);
      if (nextDue <= today) {
        nextDue = new Date(currentYear + 1, currentMonth, dueDay);
      }
      break;
    }
    case 'monthly':
    default: {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      nextDue = new Date(currentYear, currentMonth, dueDay);
      if (nextDue <= today) {
        nextDue = new Date(currentYear, currentMonth + 1, dueDay);
      }
      break;
    }
  }
  
  return nextDue.toISOString().split('T')[0];
}

/**
 * Calculate due_day from statement_close_day and grace_period.
 * Credit cards: statement closes on day X, payment due ~21 days later.
 * Example: statement closes 12th + 21 grace = due on 3rd (of next month)
 */
function calculateDueDayFromStatement(statementCloseDay: number, gracePeriodDays: number = 21): number {
  const total = statementCloseDay + gracePeriodDays;
  // If total > days in a typical month, wrap to next month
  if (total > 31) {
    return total - 31;
  }
  if (total > 28) {
    // Simplify: assume ~30 day months, due day wraps if > 30
    return total > 30 ? total - 30 : total;
  }
  return total;
}

/**
 * Calculate the next due date for a credit card based on statement date.
 * Uses the user-provided due date directly - no complex calculations.
 */
function calculateCreditCardDueDate(userProvidedDueDate: string): string {
  const dueDate = new Date(userProvidedDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  // If the provided due date is in the future, use it directly
  if (dueDate > today) {
    return dueDate.toISOString().split('T')[0];
  }
  
  // If it's in the past, calculate next month's due date
  const dueDay = dueDate.getDate();
  return calculateNextDueDate(dueDay, 'monthly', today);
}

/**
 * Advance the due date by one billing cycle (for after payment)
 */
function advanceDueDate(currentDueDate: string, frequency: BillFrequency = 'monthly'): string {
  const dueDate = new Date(currentDueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  switch (frequency) {
    case 'weekly':
      dueDate.setDate(dueDate.getDate() + 7);
      break;
    case 'biweekly':
      dueDate.setDate(dueDate.getDate() + 14);
      break;
    case 'yearly':
      dueDate.setFullYear(dueDate.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      dueDate.setMonth(dueDate.getMonth() + 1);
      break;
  }
  
  return dueDate.toISOString().split('T')[0];
}

// Helper to calculate business days before a date
function getBusinessDaysBefore(date: Date, days: number): Date {
  const result = new Date(date);
  let count = 0;
  
  while (count < days) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  
  return result;
}

// Calculate days until due (including today)
export function getDaysUntilDue(nextDueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Check if should show reminder (5 business days before)
export function shouldShowReminder(nextDueDate: string): boolean {
  const dueDate = new Date(nextDueDate);
  const reminderDate = getBusinessDaysBefore(dueDate, 5);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reminderDate.setHours(0, 0, 0, 0);
  
  return today >= reminderDate;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  type: string;
  last_four_digits: string | null;
  due_day: number;
  amount: number | null;
  next_due_date: string;
  frequency: BillFrequency;
  billing_cycle_days: number | null;
  grace_period_days: number | null;
  last_statement_date: string | null;
  reminder_sent: boolean;
  is_paid: boolean;
  paid_at: string | null;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
}

function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}

export function useBills() {
  const { user, isLoading: authLoading } = useAuthUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bills and auto-reset overdue paid bills
  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      
      const billsData = data as Bill[];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check for bills that need to be reset (past due date and marked as paid)
      const billsToReset = billsData.filter(bill => {
        const dueDate = new Date(bill.next_due_date);
        dueDate.setHours(0, 0, 0, 0);
        return bill.is_paid && dueDate < today;
      });
      
      // Auto-reset overdue paid bills - advance to next cycle
      if (billsToReset.length > 0) {
        for (const bill of billsToReset) {
          const frequency = (bill.frequency || 'monthly') as BillFrequency;
          const nextDueDate = advanceDueDate(bill.next_due_date, frequency);
          
          await supabase
            .from('bills')
            .update({ 
              is_paid: false, 
              next_due_date: nextDueDate,
              reminder_sent: false,
              snoozed_until: null
            })
            .eq('id', bill.id)
            .eq('user_id', user.id);
        }
        
        // Re-fetch after reset
        const { data: refreshedData, error: refreshError } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', user.id)
          .order('next_due_date', { ascending: true });
        
        if (refreshError) throw refreshError;
        return refreshedData as Bill[];
      }
      
      return billsData;
    },
    enabled: !!user,
  });

  // Add bill - simplified approach
  const addBillMutation = useMutation({
    mutationFn: async (billData: {
      name: string;
      type: string;
      last_four_digits?: string;
      due_day?: number;
      amount?: number;
      frequency?: BillFrequency;
      billing_cycle_days?: number;
      grace_period_days?: number;
      last_statement_date?: string;
      next_due_date?: string; // Allow direct due date from AI
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      let nextDueDate: string;
      let dueDay = billData.due_day || 1;
      
      // If AI provided the due date directly, use it
      if (billData.next_due_date) {
        nextDueDate = billData.next_due_date;
        dueDay = new Date(billData.next_due_date).getDate();
      } else if (['credit_card', 'loan'].includes(billData.type) && billData.last_statement_date) {
        // Credit card: calculate from statement date + grace period
        const statementDate = new Date(billData.last_statement_date);
        const gracePeriod = billData.grace_period_days || 21;
        const dueDate = new Date(statementDate);
        dueDate.setDate(dueDate.getDate() + gracePeriod);
        nextDueDate = dueDate.toISOString().split('T')[0];
        dueDay = dueDate.getDate();
      } else {
        // Regular bills: use due_day
        const frequency = billData.frequency || 'monthly';
        nextDueDate = calculateNextDueDate(dueDay, frequency);
      }
      
      const { data, error } = await supabase
        .from('bills')
        .insert({
          user_id: user.id,
          name: billData.name,
          type: billData.type,
          last_four_digits: billData.last_four_digits || null,
          due_day: dueDay,
          amount: billData.amount || null,
          next_due_date: nextDueDate,
          frequency: billData.frequency || 'monthly',
          billing_cycle_days: billData.billing_cycle_days || null,
          grace_period_days: billData.grace_period_days || null,
          last_statement_date: billData.last_statement_date || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: "Bill added",
        description: "Your bill has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update bill
  const updateBillMutation = useMutation({
    mutationFn: async ({ name, data }: { name: string; data: Partial<Bill> }) => {
      if (!user) throw new Error('Not authenticated');
      
      const bill = bills.find(b => b.name.toLowerCase().includes(name.toLowerCase()));
      if (!bill) throw new Error(`Bill "${name}" not found`);
      
      let updateData: any = { ...data };
      
      // If due_day changed, recalculate next_due_date
      if (data.due_day && data.due_day !== bill.due_day) {
        const frequency = data.frequency ?? bill.frequency;
        updateData.next_due_date = calculateNextDueDate(data.due_day, frequency as BillFrequency);
      }
      
      const { error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', bill.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: "Bill updated",
        description: "Your bill has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete bill
  const deleteBillMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const bill = bills.find(b => b.name.toLowerCase().includes(name.toLowerCase()));
      if (!bill) throw new Error(`Bill "${name}" not found`);
      
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', bill.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: "Bill removed",
        description: "Your bill has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mark bill as paid - DOES NOT change due date immediately.
   * The due date stays the same until the billing cycle naturally passes,
   * then auto-reset advances it to the next month.
   */
  const markAsPaidMutation = useMutation({
    mutationFn: async (billId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const bill = bills.find(b => b.id === billId);
      if (!bill) throw new Error('Bill not found');
      
      // Just mark as paid - don't change the due date
      // The auto-reset logic will advance the date when the due date passes
      const { error } = await supabase
        .from('bills')
        .update({ 
          is_paid: true,
          paid_at: new Date().toISOString(),
          snoozed_until: null,
          reminder_sent: false
        })
        .eq('id', billId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: "Bill marked as paid",
        description: "Reminders paused. Next due date will update after current cycle ends.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Snooze bill notifications
  const snoozeBillMutation = useMutation({
    mutationFn: async ({ billId, snoozeUntil }: { billId: string; snoozeUntil: Date }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bills')
        .update({ 
          snoozed_until: snoozeUntil.toISOString()
        })
        .eq('id', billId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: "Notifications snoozed",
        description: "You won't receive reminders until the snooze period ends.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset paid status manually
  const resetPaidStatusMutation = useMutation({
    mutationFn: async (billId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bills')
        .update({ 
          is_paid: false,
          paid_at: null,
          reminder_sent: false,
          snoozed_until: null
        })
        .eq('id', billId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast({
        title: "Status reset",
        description: "Bill marked as unpaid.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    bills,
    isLoading: authLoading || billsLoading,
    addBill: addBillMutation.mutate,
    updateBill: updateBillMutation.mutate,
    deleteBill: deleteBillMutation.mutate,
    markAsPaid: markAsPaidMutation.mutate,
    snoozeBill: snoozeBillMutation.mutate,
    resetPaidStatus: resetPaidStatusMutation.mutate,
  };
}
