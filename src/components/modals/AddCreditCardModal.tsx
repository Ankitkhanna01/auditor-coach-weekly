import { useState } from "react";
import { X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCreditCardModal({ isOpen, onClose }: AddCreditCardModalProps) {
  const [name, setName] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [annualFee, setAnnualFee] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [cashbackRate, setCashbackRate] = useState("");
  const [billingCycle, setBillingCycle] = useState("21");
  
  const { addCreditCard } = useFinanceData();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a card name");
      return;
    }
    if (!creditLimit || parseFloat(creditLimit) <= 0) {
      toast.error("Please enter a valid credit limit");
      return;
    }

    addCreditCard.mutate({
      name: name.trim(),
      credit_limit: parseFloat(creditLimit),
      balance: parseFloat(balance) || 0,
      cashback_rate: parseFloat(cashbackRate) || 0,
      billing_cycle: parseInt(billingCycle) || 21,
    }, {
      onSuccess: () => {
        toast.success("Credit card added!");
        resetForm();
        onClose();
      }
    });
  };

  const resetForm = () => {
    setName("");
    setCreditLimit("");
    setBalance("");
    setAnnualFee("");
    setInterestRate("");
    setCashbackRate("");
    setBillingCycle("21");
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
              <CreditCard className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Add Credit Card</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Card Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TD Cashback Visa"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Credit Limit</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Current Balance</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Annual Fee ($)</label>
              <input
                type="number"
                value={annualFee}
                onChange={(e) => setAnnualFee(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Interest Rate (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="19.99"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Cashback Rate (%)</label>
              <input
                type="number"
                value={cashbackRate}
                onChange={(e) => setCashbackRate(e.target.value)}
                placeholder="1.5"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Billing Cycle (days)</label>
              <input
                type="number"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                placeholder="21"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !creditLimit}
            className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Add Credit Card
          </button>
        </div>
      </div>
    </div>
  );
}