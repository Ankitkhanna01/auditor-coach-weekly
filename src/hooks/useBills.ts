import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

// Helper to calculate next due date from due_day
function calculateNextDueDate(dueDay: number): string {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Create date for this month's due date
  let nextDue = new Date(currentYear, currentMonth, dueDay);
  
  // If the due date has already passed this month, move to next month
  if (nextDue <= today) {
    nextDue = new Date(currentYear, currentMonth + 1, dueDay);
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
    // Skip weekends (0 = Sunday, 6 = Saturday)
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

  // Fetch bills
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
      return data as Bill[];
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
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const nextDueDate = calculateNextDueDate(billData.due_day);
      
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
      
      // Find the bill by name
      const bill = bills.find(b => b.name.toLowerCase().includes(name.toLowerCase()));
      if (!bill) throw new Error(`Bill "${name}" not found`);
      
      // If due_day is being updated, recalculate next_due_date
      let updateData: any = { ...data };
      if (data.due_day) {
        updateData.next_due_date = calculateNextDueDate(data.due_day);
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
      
      // Find the bill by name
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

  // Mark bill as paid
  const markAsPaidMutation = useMutation({
    mutationFn: async (billId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const bill = bills.find(b => b.id === billId);
      if (!bill) throw new Error('Bill not found');
      
      // Mark as paid and calculate next month's due date
      const nextDueDate = calculateNextDueDate(bill.due_day);
      
      const { error } = await supabase
        .from('bills')
        .update({ 
          is_paid: true,
          next_due_date: nextDueDate,
          snoozed_until: null
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
