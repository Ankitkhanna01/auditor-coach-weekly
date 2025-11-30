import { useState } from "react";
import { Home, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BillDashboard } from "@/components/screens/BillDashboard";
import { BillChat } from "@/components/chat/BillChat";
import { Settings } from "@/components/screens/Settings";

const tabs = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "settings", icon: SettingsIcon, label: "Settings" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <BillDashboard />;
      case "chat":
        return <BillChat />;
      case "settings":
        return <Settings />;
      default:
        return <BillDashboard />;
    }
  };

  return (
    <div className="app-container min-h-screen bg-background">
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
