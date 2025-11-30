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

const initialAccounts: Account[] = [
  { id: '1', name: 'TD Checking', type: 'checking', balance: 3200, institution: 'TD Bank' },
  { id: '2', name: 'EQ Savings', type: 'savings', balance: 6800, institution: 'EQ Bank' },
  { id: '3', name: 'Wealthsimple TFSA', type: 'tfsa', balance: 8420, mer: 0.15, institution: 'Wealthsimple' },
  { id: '4', name: 'RRSP Portfolio', type: 'rrsp', balance: 12500, mer: 0.22, institution: 'Questrade' },
];

const initialCreditCards: CreditCard[] = [
  { id: '1', name: 'Amex Cobalt', balance: 450, limit: 5000, dueDate: '2025-12-03', billingCycle: 25, cashbackRate: 5, todaySpent: 45 },
  { id: '2', name: 'TD Cashback', balance: 790, limit: 8000, dueDate: '2025-11-28', billingCycle: 21, cashbackRate: 2, todaySpent: 82 },
];

const initialLoans: Loan[] = [
  { id: '1', name: 'Car Loan', type: 'car', balance: 4200, interestRate: 6.5, monthlyPayment: 220, dueDate: '2025-12-15', lender: 'TD Auto Finance' },
  { id: '2', name: 'Mortgage', type: 'mortgage', balance: 92000, interestRate: 3.2, monthlyPayment: 1450, dueDate: '2025-12-01', lender: 'Scotiabank' },
];

const initialSubscriptions: Subscription[] = [
  { id: '1', name: 'Phone Plan', cost: 60, billingCycle: 'monthly', dueDate: '2025-12-05', category: 'utilities' },
  { id: '2', name: 'Netflix', cost: 14, billingCycle: 'monthly', dueDate: '2025-12-10', category: 'streaming' },
  { id: '3', name: 'Spotify', cost: 8, billingCycle: 'monthly', dueDate: '2025-12-12', category: 'streaming' },
  { id: '4', name: 'Gym Membership', cost: 35, billingCycle: 'monthly', dueDate: '2025-12-01', category: 'fitness' },
];

const initialGoals: Goal[] = [
  { id: '1', name: 'New Car', targetAmount: 8000, currentAmount: 3600, targetDate: '2026-06-01', priority: 'high', icon: '🚗' },
  { id: '2', name: 'Japan Trip', targetAmount: 2500, currentAmount: 250, targetDate: '2026-03-15', priority: 'medium', icon: '✈️' },
  { id: '3', name: 'Emergency Fund', targetAmount: 5000, currentAmount: 3000, targetDate: '2025-12-31', priority: 'high', icon: '🛡️' },
];

const initialTransactions: Transaction[] = [
  { id: '1', amount: 45, category: 'Dining', merchant: 'Starbucks', date: '2025-11-28', cardId: '1' },
  { id: '2', amount: 82, category: 'Groceries', merchant: 'Costco', date: '2025-11-28', cardId: '2' },
  { id: '3', amount: 120, category: 'Gas', merchant: 'Petro Canada', date: '2025-11-27', cardId: '2' },
  { id: '4', amount: 35, category: 'Entertainment', merchant: 'Cineplex', date: '2025-11-26', cardId: '1' },
];

const initialDiscrepancies: Discrepancy[] = [
  { 
    id: '1', 
    type: 'cashback', 
    severity: 'medium',
    title: 'Missing Cashback - Costco',
    description: 'Expected 2% cashback on $82 Costco purchase but received 0%',
    question: 'Hi, I noticed my recent Costco purchase of $82 on Nov 28 didn\'t receive the expected 2% cashback. Could you please verify this transaction?',
    resolved: false
  },
  { 
    id: '2', 
    type: 'mer', 
    severity: 'low',
    title: 'MER Increase Alert',
    description: 'Wealthsimple TFSA MER appears to have increased from 0.15% to 0.17%',
    question: 'I noticed the MER on my TFSA account may have changed. Could you confirm the current management expense ratio?',
    resolved: false
  },
];

const initialWeeklyAdvice: WeeklyAdvice[] = [
  {
    id: '1',
    title: 'Accelerate Car Goal',
    description: 'You can reach your Car goal 2 months earlier by adding $45 weekly',
    action: 'Set up $45 weekly transfer to Car savings',
    impact: '+$180/month toward goal',
    applied: false
  },
  {
    id: '2',
    title: 'Optimize Card Usage',
    description: 'Switch groceries to Amex Cobalt for 5% back instead of 2%',
    action: 'Use Amex Cobalt for all grocery purchases',
    impact: 'Save ~$15 more cashback/month',
    applied: false
  },
  {
    id: '3',
    title: 'Dining Overspend Alert',
    description: 'You\'re 18% above your usual dining pattern this month',
    action: 'Consider meal prepping for remaining week',
    impact: 'Save ~$40 this week',
    applied: false
  },
];

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
