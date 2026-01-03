import { useState } from "react";
import { Bell, MessageCircle, CheckCircle, ArrowRight, Smartphone, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Bell,
    title: "Never Miss a Due Date",
    description: "Get automatic reminders 5 days, 2 days, and 1 day before your bills are due. Even when you're not using the app!",
    color: "from-violet-500 to-violet-600",
    tip: "Tip: Enable notifications when prompted to get alerts automatically",
  },
  {
    icon: MessageCircle,
    title: "Add Bills by Chatting",
    description: "Just tell us about your bills naturally. Say 'Add credit card due on 15th' — no complicated forms needed.",
    color: "from-cyan-500 to-cyan-600",
    tip: "Try: 'Add rent $1500 due on 1st of every month'",
  },
  {
    icon: Clock,
    title: "Snooze & Mark as Paid",
    description: "Tap any bill to snooze reminders or mark it as paid. We'll automatically schedule the next reminder.",
    color: "from-amber-500 to-orange-500",
    tip: "Long press on a bill for quick actions",
  },
  {
    icon: Smartphone,
    title: "Works Like a Native App",
    description: "This app is installed on your device. It works offline, loads instantly, and sends real notifications.",
    color: "from-emerald-500 to-teal-500",
    tip: "Add it to your home screen for quick access",
  },
  {
    icon: CheckCircle,
    title: "Stay on Track",
    description: "See all upcoming bills at a glance on your dashboard. Pay on time, every time, and save on late fees.",
    color: "from-success to-emerald-600",
    tip: "Your financial data stays private and secure",
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Skip button */}
      <div className="p-4 flex justify-end">
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon */}
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-8 shadow-2xl animate-scale-in`}>
          <Icon className="w-12 h-12 text-white" />
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-foreground mb-3 animate-fade-in">
          {step.title}
        </h2>
        <p className="text-muted-foreground text-base max-w-xs mb-4 animate-fade-in">
          {step.description}
        </p>
        
        {/* Tip */}
        <div className="bg-primary/10 rounded-xl px-4 py-3 max-w-xs animate-fade-in">
          <p className="text-sm text-primary font-medium">
            {step.tip}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-6 space-y-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-gradient-to-r from-violet-500 to-cyan-500"
                  : index < currentStep
                  ? "w-2 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 rounded-2xl"
        >
          {isLastStep ? "Get Started" : "Next"}
          {!isLastStep && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>
    </div>
  );
}