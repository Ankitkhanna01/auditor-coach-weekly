import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import iosStep1 from "@/assets/ios-install-step1.png";
import iosStep2 from "@/assets/ios-install-step2.png";

interface IOSInstallModalProps {
  onClose: () => void;
}

const steps = [
  { 
    image: iosStep1, 
    title: "Tap the Share button", 
    desc: "Look for the square with an arrow at the bottom of Safari" 
  },
  { 
    image: iosStep2, 
    title: "Add to Home Screen", 
    desc: "Scroll down and tap 'Add to Home Screen'" 
  },
];

const IOSInstallModal = ({ onClose }: IOSInstallModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        
        <h2 className="text-xl font-bold text-center mb-1">Install on iPhone</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Step {currentStep + 1} of {steps.length}
        </p>
        
        {/* Image display */}
        <div className="relative mb-4">
          <img 
            src={steps[currentStep].image} 
            alt={steps[currentStep].title}
            className="w-full h-auto rounded-xl border border-border"
          />
          
          {/* Navigation arrows */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="p-2 bg-background/80 backdrop-blur rounded-full ml-2 disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="p-2 bg-background/80 backdrop-blur rounded-full mr-2 disabled:opacity-30 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-6 bg-emerald-500' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Step text */}
        <div className="text-center mb-6">
          <p className="font-semibold text-lg">{steps[currentStep].title}</p>
          <p className="text-sm text-muted-foreground">{steps[currentStep].desc}</p>
        </div>

        <Button
          onClick={onClose}
          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
};

export default IOSInstallModal;
