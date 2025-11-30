import { useState } from "react";
import { Bell, MessageCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Bell,
    title: "Never Miss a Due Date",
    description: "We remind you 3 days, 1 day, and on the due date itself.",
    color: "from-violet-500 to-violet-600",
  },
  {
    icon: MessageCircle,
    title: "Add Bills by Chatting",
    description: "Just tell us about your bills naturally. No forms needed.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: CheckCircle,
    title: "Stay on Track",
    description: "See all upcoming bills at a glance. Pay on time, every time.",
    color: "from-success to-emerald-600",
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
        <p className="text-muted-foreground text-base max-w-xs animate-fade-in">
          {step.description}
        </p>
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