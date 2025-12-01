import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface Feedback {
  id: string;
  user_id: string;
  context: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useFeedback() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch user's feedback
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['feedback', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Feedback[];
    },
    enabled: !!userId,
  });

  // Submit feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ context, message }: { context: string; message?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: userId,
          context,
          message: message || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast({
        title: "Feedback sent!",
        description: "Your suggestion has been submitted to the app owner.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    feedback,
    isLoading,
    submitFeedback: submitFeedbackMutation.mutateAsync,
    isSubmitting: submitFeedbackMutation.isPending,
  };
}