import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AndroidInstallModalProps {
  onClose: () => void;
}

const steps = [
  { 
    step: 1,
    title: "Tap the Menu button", 
    desc: "Look for the ⋮ (three dots) icon in the top right corner of Chrome" 
  },
  { 
    step: 2,
    title: "Tap 'Install app' or 'Add to Home screen'", 
    desc: "Find this option in the dropdown menu" 
  },
  { 
    step: 3,
    title: "Confirm installation", 
    desc: "Tap 'Install' or 'Add' when prompted" 
  },
];

const AndroidInstallModal = ({ onClose }: AndroidInstallModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        
        <h2 className="text-xl font-bold text-center mb-1">Install on Android</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Follow these steps in Chrome
        </p>
        
        {/* Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-emerald-500">{step.step}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
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

export default AndroidInstallModal;
