import { useState } from "react";
import { X, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceData } from "@/hooks/useFinanceData";
import { toast } from "sonner";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const priorities = [
  { id: 'high', label: 'High', color: 'from-red-500 to-orange-500' },
  { id: 'medium', label: 'Medium', color: 'from-yellow-500 to-amber-500' },
  { id: 'low', label: 'Low', color: 'from-green-500 to-emerald-500' },
];

const icons = ['🎯', '🏠', '🚗', '✈️', '💰', '📱', '🎓', '💍'];

export function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [priority, setPriority] = useState("medium");
  const [icon, setIcon] = useState("🎯");
  const [targetDate, setTargetDate] = useState("");
  
  const { addGoal } = useFinanceData();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a goal name");
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    addGoal.mutate({
      name: name.trim(),
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      priority,
      icon,
      target_date: targetDate || undefined,
    }, {
      onSuccess: () => {
        toast.success("Goal created!");
        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setPriority("medium");
        setIcon("🎯");
        setTargetDate("");
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
      
      <div className="relative w-full max-w-[420px] bg-card rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Add Goal</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emergency Fund"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {icons.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                    icon === i
                      ? "bg-gradient-primary scale-110"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Target Amount</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="10000"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Current Amount</label>
              <input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    priority === p.id
                      ? `bg-gradient-to-r ${p.color} text-white`
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !targetAmount}
            className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}
