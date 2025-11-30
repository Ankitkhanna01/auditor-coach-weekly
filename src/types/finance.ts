export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'tfsa' | 'rrsp' | 'brokerage';
  balance: number;
  contributions?: number;
  mer?: number;
  institution?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  dueDate: string;
  billingCycle: number;
  cashbackRate: number;
  todaySpent: number;
}

export interface Loan {
  id: string;
  name: string;
  type: 'car' | 'mortgage' | 'personal' | 'student';
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string;
  lender: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  billingCycle: 'monthly' | 'yearly';
  dueDate: string;
  category: 'streaming' | 'fitness' | 'software' | 'utilities' | 'other';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  cardId?: string;
  accountId?: string;
  note?: string;
  source?: string;
}

export interface Discrepancy {
  id: string;
  type: 'mer' | 'cashback' | 'loan' | 'subscription' | 'balance';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  question: string;
  resolved: boolean;
}

export interface WeeklyAdvice {
  id: string;
  title: string;
  description: string;
  action: string;
  impact: string;
  applied: boolean;
}
