import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/hooks/useFeedback";
import { Send, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: string;
}

export function FeedbackDialog({ open, onOpenChange, context }: FeedbackDialogProps) {
  const [message, setMessage] = useState("");
  const { submitFeedback, isSubmitting } = useFeedback();

  const handleSubmit = async () => {
    await submitFeedback({ context, message });
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            This suggestion will be sent to the app owner for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">About:</p>
            <p className="text-sm">{context}</p>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="What would you like to change or suggest?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Sending..." : "Send to Owner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}