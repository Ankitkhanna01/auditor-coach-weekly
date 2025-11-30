import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatFABProps {
  onClick: () => void;
}

export function ChatFAB({ onClick }: ChatFABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-5 py-3",
        "bg-gradient-to-r from-violet-600 to-cyan-500",
        "rounded-full shadow-lg shadow-primary/30",
        "hover:scale-105 active:scale-95 transition-all duration-200",
        "text-white font-semibold text-sm"
      )}
    >
      <Sparkles className="w-4 h-4" />
      <span>Chat with Auditor</span>
      <MessageCircle className="w-4 h-4" />
    </button>
  );
}