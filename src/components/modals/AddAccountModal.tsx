import { useState } from "react";
import { X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const accountTypes = [
  { id: 'checking', label: 'Checking' },
  { id: 'savings', label: 'Savings' },
  { id: 'tfsa', label: 'TFSA' },
  { id: 'rrsp', label: 'RRSP' },
  { id: 'brokerage', label: 'Brokerage' },
  { id: 'other', label: 'Other' },
];

const investmentTypes = [
  { id: 'gic', label: 'GIC' },
  { id: 'mutual_fund', label: 'Mutual Fund' },
  { id: 'etf', label: 'ETF' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'mixed', label: 'Mixed' },
];

const isInvestmentAccount = (type: string) => ['tfsa', 'rrsp', 'brokerage'].includes(type);

export function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [institution, setInstitution] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [investmentType, setInvestmentType] = useState("mixed");
  const [interestRate, setInterestRate] = useState("");
  const [mer, setMer] = useState("");
  const [fundName, setFundName] = useState("");
  const [source, setSource] = useState("");
  
  const { addAccount } = useFinanceData();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter an account name");
      return;
    }

    const accountData: any = {
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      institution: institution.trim() || null,
    };

    // Add MER for investment accounts with mutual funds/ETFs
    if (isInvestmentAccount(type) && (investmentType === 'mutual_fund' || investmentType === 'etf')) {
      accountData.mer = parseFloat(mer) || null;
    }

    addAccount.mutate(accountData, {
      onSuccess: () => {
        toast.success("Account added!");
        resetForm();
        onClose();
      }
    });
  };

  const resetForm = () => {
    setName("");
    setType("checking");
    setBalance("");
    setInstitution("");
    setMonthlyFee("");
    setInvestmentType("mixed");
    setInterestRate("");
    setMer("");
    setFundName("");
    setSource("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[420px] bg-card rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Add Account</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {accountTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    type === t.id
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., TD Bank, Wealthsimple"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Current Balance</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Monthly Fee ($)</label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Investment-specific fields */}
          {isInvestmentAccount(type) && (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">What's invested in this account?</label>
                <div className="grid grid-cols-3 gap-2">
                  {investmentTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setInvestmentType(t.id)}
                      className={cn(
                        "px-2 py-2 rounded-lg text-xs font-medium transition-all",
                        investmentType === t.id
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {investmentType === 'gic' && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">GIC Interest Rate (%)</label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="4.5"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {(investmentType === 'mutual_fund' || investmentType === 'etf') && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Fund/ETF Name</label>
                    <input
                      type="text"
                      value={fundName}
                      onChange={(e) => setFundName(e.target.value)}
                      placeholder="e.g., VGRO, TD e-Series"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">MER / Management Fee (%)</label>
                    <input
                      type="number"
                      value={mer}
                      onChange={(e) => setMer(e.target.value)}
                      placeholder="0.25"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">This fee is deducted from your returns annually</p>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Where did this money come from? (Optional)</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Salary, Gift, Savings..."
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Add Account
          </button>
        </div>
      </div>
    </div>
  );
}