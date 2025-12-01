import { useState, useEffect } from "react";
import { Home, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BillDashboard } from "@/components/screens/BillDashboard";
import { BillChat } from "@/components/chat/BillChat";
import { Settings } from "@/components/screens/Settings";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { SharePrompt } from "@/components/onboarding/SharePrompt";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/hooks/useAuth";
import { useBills, Bill } from "@/hooks/useBills";
import { format } from "date-fns";

const tabs = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "settings", icon: SettingsIcon, label: "Settings" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const { bills } = useBills();
  
  const {
    showOnboarding,
    completeOnboarding,
    showSharePrompt,
    checkSharePrompt,
    dismissSharePrompt,
    markAsShared,
    triggerSharePrompt,
  } = useOnboarding(user?.id);

  // Check for share prompt when bill count changes
  useEffect(() => {
    if (bills && bills.length > 0) {
      checkSharePrompt(bills.length);
    }
  }, [bills?.length, checkSharePrompt]);

  // Handle bill click - switch to chat with context
  const handleBillClick = (bill: Bill) => {
    const paidDate = bill.paid_at ? format(new Date(bill.paid_at), "MMMM d, yyyy") : "recently";
    const nextDue = format(new Date(bill.next_due_date), "MMMM d, yyyy");
    
    const message = `I want to update my ${bill.name} bill. I marked it as paid on ${paidDate}. The next due date is ${nextDue}. What would you like to change?`;
    
    setContextMessage(message);
    setActiveTab("chat");
  };

  // Clear context message after it's been used
  const clearContextMessage = () => {
    setContextMessage(null);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <BillDashboard onBillClick={handleBillClick} />;
      case "chat":
        return (
          <BillChat 
            contextMessage={contextMessage} 
            onContextUsed={clearContextMessage} 
          />
        );
      case "settings":
        return <Settings onShareClick={triggerSharePrompt} />;
      default:
        return <BillDashboard onBillClick={handleBillClick} />;
    }
  };

  return (
    <div className="app-container min-h-screen bg-background">
      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={completeOnboarding} />
      )}

      {/* Share Prompt */}
      {showSharePrompt && !showOnboarding && (
        <SharePrompt 
          onClose={dismissSharePrompt} 
          onShare={markAsShared} 
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "overflow-y-auto min-h-screen",
        activeTab === "chat" ? "px-0 pt-0 pb-16" : "px-4 pt-6 pb-24"
      )}>
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bottom-nav z-40">
        <div className="max-w-[420px] mx-auto flex justify-around items-center h-16 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-300",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  isActive && "bg-gradient-primary shadow-glow"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive && "text-primary-foreground"
                  )} />
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;