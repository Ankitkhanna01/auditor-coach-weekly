import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  Home,
  Car,
  GraduationCap,
  Wallet,
  Calculator,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const loanTypeIcons: Record<string, typeof Home> = {
  mortgage: Home,
  car: Car,
  student: GraduationCap,
  personal: Wallet,
  line_of_credit: Wallet,
  other: Wallet,
};

const loanTypeColors: Record<string, string> = {
  mortgage: 'from-blue-500 to-blue-600',
  car: 'from-purple-500 to-purple-600',
  student: 'from-green-500 to-green-600',
  personal: 'from-orange-500 to-orange-600',
  line_of_credit: 'from-cyan-500 to-cyan-600',
  other: 'from-gray-500 to-gray-600',
};

export function Loans() {
  const { loans, isLoading } = useFinanceData();
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  
  const totalDebt = loans.reduce((sum, loan) => sum + Number(loan.balance), 0);
  const totalMonthlyPayment = loans.reduce((sum, loan) => sum + Number(loan.monthly_payment), 0);

  // Mock calculation for invest vs paydown
  const assumedInvestmentReturn = 7; // 7% annual return
  
  const calculateComparison = (loan: typeof loans[0]) => {
    const yearlyInterestSaved = Number(loan.balance) * (Number(loan.interest_rate) / 100);
    const yearlyInvestmentReturn = Number(loan.monthly_payment) * 12 * (assumedInvestmentReturn / 100);
    return {
      interestSaved: yearlyInterestSaved,
      investmentReturn: yearlyInvestmentReturn,
      recommendation: yearlyInvestmentReturn > yearlyInterestSaved ? 'invest' : 'paydown'
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8 stagger-children">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Loans</h1>
        <p className="text-muted-foreground text-sm">Manage your debt</p>
      </div>

      {/* Total Debt */}
      <GlassCard elevated className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial opacity-40" />
        <div className="relative">
          <p className="text-muted-foreground text-sm mb-1">Total Debt</p>
          <AnimatedCounter 
            value={totalDebt} 
            prefix="$" 
            className="text-3xl font-bold"
          />
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Payments</p>
              <p className="font-semibold">${totalMonthlyPayment.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Active Loans</p>
              <p className="font-semibold">{loans.length}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Loans List */}
      <div className="space-y-4">
        {loans.map((loan) => {
          const Icon = loanTypeIcons[loan.type] || Wallet;
          const comparison = calculateComparison(loan);
          
          return (
            <GlassCard key={loan.id} className="p-0 overflow-hidden">
              {/* Loan Header */}
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    loanTypeColors[loan.type] || loanTypeColors.other
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{loan.name}</h3>
                    <p className="text-xs text-muted-foreground">{loan.lender}</p>
                  </div>

                  <div className="text-right">
                    <AnimatedCounter 
                      value={Number(loan.balance)} 
                      prefix="$" 
                      className="text-lg font-bold"
                    />
                    <p className="text-xs text-muted-foreground">{loan.interest_rate}% APR</p>
                  </div>
                </div>

                {/* Loan Stats */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Monthly Payment</p>
                    <p className="font-semibold">${loan.monthly_payment}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-semibold">
                      {loan.due_date ? new Date(loan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invest vs Paydown Comparison */}
              <div 
                className={cn(
                  "p-4 border-t border-border cursor-pointer transition-colors",
                  selectedLoanId === loan.id ? "bg-muted/30" : "hover:bg-muted/20"
                )}
                onClick={() => setSelectedLoanId(selectedLoanId === loan.id ? null : loan.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Should you pay extra or invest?</span>
                </div>

                {selectedLoanId === loan.id && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    {/* Pay Down Option */}
                    <div className={cn(
                      "p-3 rounded-lg border",
                      comparison.recommendation === 'paydown' 
                        ? "border-success bg-success/10" 
                        : "border-border"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Pay Extra</p>
                          <p className="text-xs text-muted-foreground">Interest saved yearly</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">${comparison.interestSaved.toFixed(0)}</p>
                          {comparison.recommendation === 'paydown' && (
                            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Invest Option */}
                    <div className={cn(
                      "p-3 rounded-lg border",
                      comparison.recommendation === 'invest' 
                        ? "border-primary bg-primary/10" 
                        : "border-border"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Invest Instead</p>
                          <p className="text-xs text-muted-foreground">Projected return (7% avg)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">${comparison.investmentReturn.toFixed(0)}</p>
                          {comparison.recommendation === 'invest' && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Based on your {loan.interest_rate}% loan rate vs 7% market return
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}

        {loans.length === 0 && (
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="font-medium mb-2">No loans yet</p>
            <p className="text-muted-foreground text-sm">
              Use the chat to add loans, mortgages, or lines of credit
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}