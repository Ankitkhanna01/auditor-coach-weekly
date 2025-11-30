import { useState } from "react";
import { X, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { id: 'streaming', label: 'Streaming' },
  { id: 'music', label: 'Music' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'software', label: 'Software' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'news', label: 'News' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'other', label: 'Other' },
];

const billingCycles = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'weekly', label: 'Weekly' },
];

export function AddSubscriptionModal({ isOpen, onClose }: AddSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("streaming");
  const [billingCycle, setBillingCycle] = useState("monthly");
  
  const { addSubscription } = useFinanceData();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a subscription name");
      return;
    }
    if (!cost || parseFloat(cost) <= 0) {
      toast.error("Please enter a valid cost");
      return;
    }

    addSubscription.mutate({
      name: name.trim(),
      cost: parseFloat(cost),
      category,
      billing_cycle: billingCycle,
    }, {
      onSuccess: () => {
        toast.success("Subscription added!");
        setName("");
        setCost("");
        setCategory("streaming");
        setBillingCycle("monthly");
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[420px] bg-card rounded-t-3xl p-6 pb-8 animate-slide-up">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Add Subscription</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Subscription Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-xs font-medium transition-all",
                    category === c.id
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Cost</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Billing Cycle</label>
            <div className="grid grid-cols-3 gap-2">
              {billingCycles.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBillingCycle(b.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    billingCycle === b.id
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !cost}
            className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Add Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
