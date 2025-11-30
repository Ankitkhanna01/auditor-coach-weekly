import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "neverLate-onboarding-completed";
const SHARE_PROMPT_KEY = "neverLate-share-prompt";
const BILL_COUNT_KEY = "neverLate-bill-count-for-share";

interface SharePromptData {
  lastShown: number;
  timesShown: number;
  shared: boolean;
}

export function useOnboarding(userId: string | undefined) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  // Check if onboarding should be shown
  useEffect(() => {
    if (!userId) return;
    
    const completed = localStorage.getItem(`${ONBOARDING_KEY}-${userId}`);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, [userId]);

  const completeOnboarding = useCallback(() => {
    if (!userId) return;
    localStorage.setItem(`${ONBOARDING_KEY}-${userId}`, "true");
    setShowOnboarding(false);
  }, [userId]);

  // Science-based share prompt logic
  // Triggers after: first bill added AND at least 1 day of usage AND not shown in last 7 days
  const checkSharePrompt = useCallback((billCount: number) => {
    if (!userId) return;
    
    const stored = localStorage.getItem(`${SHARE_PROMPT_KEY}-${userId}`);
    const data: SharePromptData = stored 
      ? JSON.parse(stored) 
      : { lastShown: 0, timesShown: 0, shared: false };

    // Don't show if user already shared
    if (data.shared) return;

    // Don't show more than 3 times total
    if (data.timesShown >= 3) return;

    // Don't show if shown in last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (data.lastShown > sevenDaysAgo) return;

    // Only show after user has added at least 1 bill
    if (billCount < 1) return;

    // Check if this is a new bill milestone (1st, 3rd, 5th bill)
    const prevCount = parseInt(localStorage.getItem(`${BILL_COUNT_KEY}-${userId}`) || "0");
    const milestones = [1, 3, 5];
    
    if (milestones.includes(billCount) && prevCount < billCount) {
      localStorage.setItem(`${BILL_COUNT_KEY}-${userId}`, billCount.toString());
      
      // Small delay to let user see their accomplishment first
      setTimeout(() => {
        setShowSharePrompt(true);
      }, 1500);
    }
  }, [userId]);

  const dismissSharePrompt = useCallback(() => {
    if (!userId) return;
    
    const stored = localStorage.getItem(`${SHARE_PROMPT_KEY}-${userId}`);
    const data: SharePromptData = stored 
      ? JSON.parse(stored) 
      : { lastShown: 0, timesShown: 0, shared: false };

    data.lastShown = Date.now();
    data.timesShown += 1;
    
    localStorage.setItem(`${SHARE_PROMPT_KEY}-${userId}`, JSON.stringify(data));
    setShowSharePrompt(false);
  }, [userId]);

  const markAsShared = useCallback(() => {
    if (!userId) return;
    
    const stored = localStorage.getItem(`${SHARE_PROMPT_KEY}-${userId}`);
    const data: SharePromptData = stored 
      ? JSON.parse(stored) 
      : { lastShown: 0, timesShown: 0, shared: false };

    data.shared = true;
    data.lastShown = Date.now();
    
    localStorage.setItem(`${SHARE_PROMPT_KEY}-${userId}`, JSON.stringify(data));
    setShowSharePrompt(false);
  }, [userId]);

  // Manual trigger for settings
  const triggerSharePrompt = useCallback(() => {
    setShowSharePrompt(true);
  }, []);

  return {
    showOnboarding,
    completeOnboarding,
    showSharePrompt,
    checkSharePrompt,
    dismissSharePrompt,
    markAsShared,
    triggerSharePrompt,
  };
}