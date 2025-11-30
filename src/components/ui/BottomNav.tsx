import { Home, Wallet, CreditCard, Landmark, Target, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "accounts", icon: Wallet, label: "Accounts" },
  { id: "cards", icon: CreditCard, label: "Cards" },
  { id: "loans", icon: Landmark, label: "Loans" },
  { id: "subscriptions", icon: Receipt, label: "Bills" },
  { id: "goals", icon: Target, label: "Goals" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bottom-nav z-40">
      <div className="max-w-[420px] mx-auto flex justify-around items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-300",
                isActive && "bg-gradient-primary shadow-glow"
              )}>
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive && "text-primary-foreground"
                )} />
              </div>
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
