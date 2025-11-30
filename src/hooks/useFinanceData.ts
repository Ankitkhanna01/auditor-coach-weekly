import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Self-contained auth hook for this data layer
const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};

export const useFinanceData = () => {
  const { user, loading: authLoading } = useAuthUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Credit Cards
  const { data: creditCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['credit_cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Loans
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Subscriptions
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Transactions
  const { data: transactions = [], isLoading: transLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Discrepancies
  const { data: discrepancies = [], isLoading: discrepLoading } = useQuery({
    queryKey: ['discrepancies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discrepancies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Weekly Advice
  const { data: weeklyAdvice = [], isLoading: adviceLoading } = useQuery({
    queryKey: ['weekly_advice', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_advice')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Recurring Transactions
  const { data: recurringTransactions = [], isLoading: recurringLoading } = useQuery({
    queryKey: ['recurring_transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Mutations
  const addAccount = useMutation({
    mutationFn: async (account: { name: string; type: string; balance: number; institution?: string; mer?: number }) => {
      const { error } = await supabase.from('accounts').insert({
        ...account,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add account', description: error.message, variant: 'destructive' });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ name: string; type: string; balance: number; institution: string; mer: number }> }) => {
      const { error } = await supabase.from('accounts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const addToBalance = useMutation({
    mutationFn: async ({ id, amount, source }: { id: string; amount: number; source: string }) => {
      const account = accounts.find(a => a.id === id);
      if (!account) throw new Error('Account not found');
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) + amount })
        .eq('id', id);
      if (updateError) throw updateError;

      const { error: transError } = await supabase.from('transactions').insert({
        user_id: user!.id,
        amount,
        category: 'Deposit',
        merchant: 'Transfer',
        date: new Date().toISOString().split('T')[0],
        account_id: id,
        source,
      });
      if (transError) throw transError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Balance updated' });
    },
  });

  const addCreditCard = useMutation({
    mutationFn: async (card: { name: string; balance?: number; credit_limit: number; due_date?: string; billing_cycle?: number; cashback_rate?: number }) => {
      const { error } = await supabase.from('credit_cards').insert({
        ...card,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards'] });
      toast({ title: 'Credit card added' });
    },
  });

  const addCardTransaction = useMutation({
    mutationFn: async ({ cardId, amount, merchant, category }: { cardId: string; amount: number; merchant: string; category: string }) => {
      const card = creditCards.find(c => c.id === cardId);
      if (!card) throw new Error('Card not found');

      const { error: updateError } = await supabase
        .from('credit_cards')
        .update({ 
          balance: Number(card.balance) + amount,
          today_spent: Number(card.today_spent || 0) + amount 
        })
        .eq('id', cardId);
      if (updateError) throw updateError;

      const { error: transError } = await supabase.from('transactions').insert({
        user_id: user!.id,
        amount,
        category,
        merchant,
        date: new Date().toISOString().split('T')[0],
        card_id: cardId,
      });
      if (transError) throw transError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction added' });
    },
  });

  const addLoan = useMutation({
    mutationFn: async (loan: { name: string; type: string; balance: number; interest_rate: number; monthly_payment: number; due_date?: string; lender?: string }) => {
      const { error } = await supabase.from('loans').insert({
        ...loan,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan added' });
    },
  });

  const updateLoan = useMutation({
    mutationFn: async ({ id, name, updates }: { id?: string; name?: string; updates: Partial<{ balance: number; interest_rate: number; monthly_payment: number; due_date: string; lender: string }> }) => {
      let loanId = id;
      if (!loanId && name) {
        const matchingLoan = loans.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
        if (matchingLoan) loanId = matchingLoan.id;
      }
      if (!loanId) throw new Error('Loan not found');
      
      const { error } = await supabase.from('loans').update(updates).eq('id', loanId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan updated' });
    },
  });

  const deleteLoan = useMutation({
    mutationFn: async ({ id, name }: { id?: string; name?: string }) => {
      let loanId = id;
      if (!loanId && name) {
        const matchingLoan = loans.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
        if (matchingLoan) loanId = matchingLoan.id;
      }
      if (!loanId) throw new Error('Loan not found');
      
      const { error } = await supabase.from('loans').delete().eq('id', loanId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan deleted' });
    },
  });

  const addSubscription = useMutation({
    mutationFn: async (sub: { name: string; cost: number; billing_cycle: string; due_date?: string; category?: string }) => {
      const { error } = await supabase.from('subscriptions').insert({
        ...sub,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Subscription added' });
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Subscription deleted' });
    },
  });

  const addGoal = useMutation({
    mutationFn: async (goal: { name: string; target_amount: number; current_amount?: number; target_date?: string; priority?: string; icon?: string }) => {
      const { error } = await supabase.from('goals').insert({
        ...goal,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Goal added' });
    },
  });

  const contributeToGoal = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Goal not found');
      
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: Number(goal.current_amount) + amount })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({ title: 'Contribution added' });
    },
  });

  const resolveDiscrepancy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discrepancies')
        .update({ resolved: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discrepancies'] }),
  });

  const applyAdvice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weekly_advice')
        .update({ applied: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekly_advice'] }),
  });

  // Add Recurring Transaction
  const addRecurringTransaction = useMutation({
    mutationFn: async (recurring: { 
      name: string; 
      amount: number; 
      frequency: string; 
      next_date: string; 
      type: string;
      account_name?: string;
    }) => {
      // Try to find account by name if provided
      let accountId: string | null = null;
      if (recurring.account_name) {
        const matchingAccount = accounts.find(a => 
          a.name.toLowerCase().includes(recurring.account_name!.toLowerCase())
        );
        if (matchingAccount) {
          accountId = matchingAccount.id;
        }
      }

      const { error } = await supabase.from('recurring_transactions').insert({
        name: recurring.name,
        amount: recurring.amount,
        frequency: recurring.frequency,
        next_date: recurring.next_date,
        type: recurring.type,
        account_id: accountId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] });
      toast({ title: 'Recurring transaction added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add recurring transaction', description: error.message, variant: 'destructive' });
    },
  });

  // Delete Recurring Transaction
  const deleteRecurringTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] });
      toast({ title: 'Recurring transaction deleted' });
    },
  });

  const isLoading = accountsLoading || cardsLoading || loansLoading || subsLoading || goalsLoading || transLoading || discrepLoading || adviceLoading || recurringLoading;

  return {
    accounts,
    creditCards,
    loans,
    subscriptions,
    goals,
    transactions,
    discrepancies,
    weeklyAdvice,
    recurringTransactions,
    isLoading,
    addAccount,
    updateAccount,
    addToBalance,
    addCreditCard,
    addCardTransaction,
    addLoan,
    updateLoan,
    deleteLoan,
    addSubscription,
    deleteSubscription,
    addGoal,
    contributeToGoal,
    resolveDiscrepancy,
    applyAdvice,
    addRecurringTransaction,
    deleteRecurringTransaction,
  };
};