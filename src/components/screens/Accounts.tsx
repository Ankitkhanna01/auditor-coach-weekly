import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  Building2, 
  Percent,
  ChevronRight,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AddBalanceModal } from "@/components/modals/AddBalanceModal";

const accountTypeLabels: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  tfsa: 'TFSA',
  rrsp: 'RRSP',
  brokerage: 'Brokerage',
  other: 'Other'
};

const accountTypeColors: Record<string, string> = {
  checking: 'from-blue-500 to-blue-600',
  savings: 'from-green-500 to-green-600',
  tfsa: 'from-purple-500 to-purple-600',
  rrsp: 'from-orange-500 to-orange-600',
  brokerage: 'from-pink-500 to-pink-600',
  other: 'from-gray-500 to-gray-600'
};

export function Accounts() {
  const { accounts, isLoading } = useFinanceData();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

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
        <h1 className="text-2xl font-bold">Accounts</h1>
        <p className="text-muted-foreground text-sm">Track your balances</p>
      </div>

      {/* Total Balance */}
      <GlassCard elevated className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial opacity-40" />
        <div className="relative">
          <p className="text-muted-foreground text-sm mb-1">Total Balance</p>
          <AnimatedCounter 
            value={totalBalance} 
            prefix="$" 
            className="text-3xl font-bold gradient-text"
          />
          <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
            <span>{accounts.length} total accounts</span>
          </div>
        </div>
      </GlassCard>

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <GlassCard key={account.id} hover className="p-4">
            <div className="flex items-center gap-4">
              {/* Account Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                accountTypeColors[account.type] || accountTypeColors.other
              )}>
                <Building2 className="w-6 h-6 text-white" />
              </div>

              {/* Account Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{account.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {accountTypeLabels[account.type] || 'Other'}
                  </span>
                </div>
                {account.institution && (
                  <p className="text-xs text-muted-foreground">{account.institution}</p>
                )}
                {account.mer && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Percent className="w-3 h-3" />
                    <span>MER: {account.mer}%</span>
                  </div>
                )}
              </div>

              {/* Balance */}
              <div className="text-right">
                <AnimatedCounter 
                  value={Number(account.balance)} 
                  prefix="$" 
                  className="text-lg font-bold"
                />
                <button 
                  onClick={() => setSelectedAccountId(account.id)}
                  className="text-xs text-primary flex items-center gap-1 mt-1 ml-auto"
                >
                  Add <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {accounts.length === 0 && (
          <GlassCard className="p-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="font-medium mb-2">No accounts yet</p>
            <p className="text-muted-foreground text-sm">
              Use the chat below to add accounts or upload your bank statement
            </p>
          </GlassCard>
        )}
      </div>

      {/* Add Balance Modal */}
      <AddBalanceModal 
        accountId={selectedAccountId}
        isOpen={!!selectedAccountId}
        onClose={() => setSelectedAccountId(null)}
      />
    </div>
  );
}