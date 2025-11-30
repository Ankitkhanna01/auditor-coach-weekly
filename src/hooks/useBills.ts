import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

// Helper to calculate next due date based on frequency
function calculateNextDueDate(dueDay: number, frequency: BillFrequency = 'monthly', fromDate?: Date): string {
  const today = fromDate || new Date();
  today.setHours(0, 0, 0, 0);
  
  let nextDue: Date;
  
  switch (frequency) {
    case 'weekly': {
      // dueDay here represents day of week (0-6, Sunday-Saturday)
      const currentDayOfWeek = today.getDay();
      const targetDay = dueDay % 7;
      let daysUntil = targetDay - currentDayOfWeek;
      if (daysUntil <= 0) daysUntil += 7;
      nextDue = new Date(today);
      nextDue.setDate(today.getDate() + daysUntil);
      break;
    }
    case 'biweekly': {
      // Similar to weekly but add 14 days if within this week
      const currentDayOfWeek = today.getDay();
      const targetDay = dueDay % 7;
      let daysUntil = targetDay - currentDayOfWeek;
      if (daysUntil <= 0) daysUntil += 14;
      else if (daysUntil < 7) daysUntil += 7; // Push to next occurrence
      nextDue = new Date(today);
      nextDue.setDate(today.getDate() + daysUntil);
      break;
    }
    case 'yearly': {
      // dueDay represents day of year (1-365) or we use the month approach
      // For simplicity, use the due_day as day of month in the current/next year
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      nextDue = new Date(currentYear, currentMonth, dueDay);
      if (nextDue <= today) {
        // Move to same date next year
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
  reminder_sent: boolean;
  is_paid: boolean;
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
      
      // Auto-reset overdue paid bills
      if (billsToReset.length > 0) {
        for (const bill of billsToReset) {
          const frequency = (bill.frequency || 'monthly') as BillFrequency;
          const nextDueDate = calculateNextDueDate(bill.due_day, frequency);
          
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

  // Add bill
  const addBillMutation = useMutation({
    mutationFn: async (billData: {
      name: string;
      type: string;
      last_four_digits?: string;
      due_day: number;
      amount?: number;
      frequency?: BillFrequency;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const frequency = billData.frequency || 'monthly';
      const nextDueDate = calculateNextDueDate(billData.due_day, frequency);
      
      const { data, error } = await supabase
        .from('bills')
        .insert({
          user_id: user.id,
          name: billData.name,
          type: billData.type,
          last_four_digits: billData.last_four_digits || null,
          due_day: billData.due_day,
          amount: billData.amount || null,
          next_due_date: nextDueDate,
          frequency: frequency,
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
      if (data.due_day || data.frequency) {
        const frequency = (data.frequency || bill.frequency || 'monthly') as BillFrequency;
        const dueDay = data.due_day || bill.due_day;
        updateData.next_due_date = calculateNextDueDate(dueDay, frequency);
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

  // Mark bill as paid - moves to next cycle based on frequency
  const markAsPaidMutation = useMutation({
    mutationFn: async (billId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const bill = bills.find(b => b.id === billId);
      if (!bill) throw new Error('Bill not found');
      
      const frequency = (bill.frequency || 'monthly') as BillFrequency;
      const nextDueDate = calculateNextDueDate(bill.due_day, frequency);
      
      const { error } = await supabase
        .from('bills')
        .update({ 
          is_paid: true,
          next_due_date: nextDueDate,
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
        description: "Notifications stopped until next billing cycle.",
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

  // Reset paid status (for next billing cycle)
  const resetPaidStatusMutation = useMutation({
    mutationFn: async (billId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bills')
        .update({ is_paid: false })
        .eq('id', billId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });

  return {
    bills,
    isLoading: authLoading || billsLoading,
    addBill: addBillMutation.mutateAsync,
    updateBill: updateBillMutation.mutateAsync,
    deleteBill: deleteBillMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    snoozeBill: snoozeBillMutation.mutateAsync,
    resetPaidStatus: resetPaidStatusMutation.mutateAsync,
  };
}
