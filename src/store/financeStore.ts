import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, CreditCard, Loan, Subscription, Goal, Transaction, Discrepancy, WeeklyAdvice } from '@/types/finance';

interface FinanceState {
  accounts: Account[];
  creditCards: CreditCard[];
  loans: Loan[];
  subscriptions: Subscription[];
  goals: Goal[];
  transactions: Transaction[];
  discrepancies: Discrepancy[];
  weeklyAdvice: WeeklyAdvice[];
  
  // Actions
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  addToBalance: (id: string, amount: number, source: string) => void;
  
  addCreditCard: (card: CreditCard) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  addCardTransaction: (cardId: string, amount: number, merchant: string, category: string) => void;
  
  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  contributeToGoal: (id: string, amount: number) => void;
  
  addTransaction: (transaction: Transaction) => void;
  
  resolveDiscrepancy: (id: string) => void;
  applyAdvice: (id: string) => void;
}

const initialAccounts: Account[] = [];

const initialCreditCards: CreditCard[] = [];

const initialLoans: Loan[] = [];

const initialSubscriptions: Subscription[] = [];

const initialGoals: Goal[] = [];

const initialTransactions: Transaction[] = [];

const initialDiscrepancies: Discrepancy[] = [];

const initialWeeklyAdvice: WeeklyAdvice[] = [];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      accounts: initialAccounts,
      creditCards: initialCreditCards,
      loans: initialLoans,
      subscriptions: initialSubscriptions,
      goals: initialGoals,
      transactions: initialTransactions,
      discrepancies: initialDiscrepancies,
      weeklyAdvice: initialWeeklyAdvice,

      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === id ? { ...acc, ...updates } : acc
          ),
        })),
      
      addToBalance: (id, amount, source) =>
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === id ? { ...acc, balance: acc.balance + amount } : acc
          ),
          transactions: [
            ...state.transactions,
            {
              id: Date.now().toString(),
              amount,
              category: 'Deposit',
              merchant: 'Transfer',
              date: new Date().toISOString().split('T')[0],
              accountId: id,
              source,
            },
          ],
        })),

      addCreditCard: (card) =>
        set((state) => ({ creditCards: [...state.creditCards, card] })),
      
      updateCreditCard: (id, updates) =>
        set((state) => ({
          creditCards: state.creditCards.map((card) =>
            card.id === id ? { ...card, ...updates } : card
          ),
        })),
      
      addCardTransaction: (cardId, amount, merchant, category) =>
        set((state) => ({
          creditCards: state.creditCards.map((card) =>
            card.id === cardId
              ? { ...card, balance: card.balance + amount, todaySpent: card.todaySpent + amount }
              : card
          ),
          transactions: [
            ...state.transactions,
            {
              id: Date.now().toString(),
              amount,
              category,
              merchant,
              date: new Date().toISOString().split('T')[0],
              cardId,
            },
          ],
        })),

      addLoan: (loan) =>
        set((state) => ({ loans: [...state.loans, loan] })),
      
      updateLoan: (id, updates) =>
        set((state) => ({
          loans: state.loans.map((loan) =>
            loan.id === id ? { ...loan, ...updates } : loan
          ),
        })),

      addSubscription: (subscription) =>
        set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
      
      updateSubscription: (id, updates) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...updates } : sub
          ),
        })),
      
      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        })),

      addGoal: (goal) =>
        set((state) => ({ goals: [...state.goals, goal] })),
      
      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates } : goal
          ),
        })),
      
      contributeToGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id
              ? { ...goal, currentAmount: goal.currentAmount + amount }
              : goal
          ),
        })),

      addTransaction: (transaction) =>
        set((state) => ({ transactions: [...state.transactions, transaction] })),

      resolveDiscrepancy: (id) =>
        set((state) => ({
          discrepancies: state.discrepancies.map((d) =>
            d.id === id ? { ...d, resolved: true } : d
          ),
        })),

      applyAdvice: (id) =>
        set((state) => ({
          weeklyAdvice: state.weeklyAdvice.map((a) =>
            a.id === id ? { ...a, applied: true } : a
          ),
        })),
    }),
    {
      name: 'auditor-finance-store',
    }
  )
);
