import { useState } from "react";
import { Share2, X, Heart, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SharePromptProps {
  onClose: () => void;
  onShare: () => void;
}

export function SharePrompt({ onClose, onShare }: SharePromptProps) {
  const handleShare = async () => {
    const shareData = {
      title: "NeverLate - Bill Reminder App",
      text: "I use this app to never miss bill payments. It's free for early adopters!",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        onShare();
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`
        );
        onShare();
      }
    } catch (err) {
      // User cancelled or error
      console.log("Share cancelled");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end animate-in fade-in">
      <div className="bg-card rounded-t-3xl p-6 w-full animate-in slide-in-from-bottom">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-center mb-2">
          Help Keep This App Free
        </h2>
        
        <p className="text-muted-foreground text-center text-sm mb-6">
          Share with friends and help us grow. The more people use it, 
          the longer we can keep it free for everyone — including you!
        </p>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Heart className="w-4 h-4 text-destructive" />
            <span className="text-muted-foreground">Help a friend avoid late fees</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Gift className="w-4 h-4 text-warning" />
            <span className="text-muted-foreground">Keep the app free for longer</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleShare}
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share with Friends
          </Button>
          
          <button
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}