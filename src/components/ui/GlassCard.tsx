import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  elevated = false, 
  onClick,
  hover = false 
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        elevated ? "glass-card-elevated" : "glass-card",
        hover && "card-hover cursor-pointer",
        "p-4 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
