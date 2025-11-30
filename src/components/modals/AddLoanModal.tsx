import { useState } from "react";
import { X, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loanTypes = [
  { id: 'mortgage', label: 'Mortgage' },
  { id: 'car', label: 'Car Loan' },
  { id: 'student', label: 'Student' },
  { id: 'personal', label: 'Personal' },
  { id: 'credit_line', label: 'Line of Credit' },
  { id: 'other', label: 'Other' },
];

export function AddLoanModal({ isOpen, onClose }: AddLoanModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("mortgage");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [lender, setLender] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const { addLoan } = useFinanceData();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a loan name");
      return;
    }
    if (!balance || parseFloat(balance) <= 0) {
      toast.error("Please enter a valid balance");
      return;
    }
    if (!interestRate) {
      toast.error("Please enter the interest rate");
      return;
    }
    if (!monthlyPayment) {
      toast.error("Please enter the monthly payment");
      return;
    }

    addLoan.mutate({
      name: name.trim(),
      type,
      balance: parseFloat(balance),
      interest_rate: parseFloat(interestRate),
      monthly_payment: parseFloat(monthlyPayment),
      lender: lender.trim() || null,
      due_date: dueDate || null,
    }, {
      onSuccess: () => {
        toast.success("Loan added!");
        resetForm();
        onClose();
      }
    });
  };

  const resetForm = () => {
    setName("");
    setType("mortgage");
    setBalance("");
    setInterestRate("");
    setMonthlyPayment("");
    setLender("");
    setDueDate("");
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
              <Landmark className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Add Loan</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Loan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Home Mortgage"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Loan Type</label>
            <div className="grid grid-cols-3 gap-2">
              {loanTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium transition-all",
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
            <label className="text-sm text-muted-foreground mb-2 block">Lender (Optional)</label>
            <input
              type="text"
              value={lender}
              onChange={(e) => setLender(e.target.value)}
              placeholder="e.g., TD Bank, RBC"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Outstanding Balance</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="250000"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Interest Rate (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="5.25"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Monthly Payment</label>
              <input
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="1500"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Next Payment Due</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !balance || !interestRate || !monthlyPayment}
            className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Add Loan
          </button>
        </div>
      </div>
    </div>
  );
}