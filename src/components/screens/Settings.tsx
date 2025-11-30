import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Key, Shield, Trash2, Share2, Gift } from "lucide-react";

interface SettingsProps {
  onShareClick?: () => void;
}

export function Settings({ onShareClick }: SettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleClearAllData = async () => {
    if (!confirm("Are you sure you want to delete all your bills? This cannot be undone.")) {
      return;
    }

    setIsDeletingData(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear local storage chat history
      localStorage.removeItem(`bill-chat-messages-${user.id}`);
      localStorage.removeItem(`bill-chat-executed-${user.id}`);

      toast({
        title: "Data cleared",
        description: "All your bills have been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "NeverLate - Bill Reminder App",
      text: "I use this app to never miss bill payments. It's free for early adopters!",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Thanks for sharing!",
          description: "You're helping keep this app free for everyone.",
        });
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Link copied!",
          description: "Share it with friends to help keep this app free.",
        });
      }
    } catch (err) {
      // User cancelled
    }
  };

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account
        </p>
      </div>

      {/* Share & Support */}
      <GlassCard className="p-5 border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-cyan-500/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Help Keep This Free</h2>
            <p className="text-xs text-muted-foreground">Share with friends</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          The more people use this app, the longer we can keep it free for everyone — including you!
        </p>

        <Button
          onClick={onShareClick || handleShare}
          className="w-full bg-gradient-to-r from-violet-500 to-cyan-500"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share with Friends
        </Button>
      </GlassCard>

      {/* Change Password */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Key className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-muted/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-muted/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </GlassCard>

      {/* Security */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold">Data & Privacy</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Your bill data is stored securely and only accessible to you.
        </p>

        <Button
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleClearAllData}
          disabled={isDeletingData}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeletingData ? "Deleting..." : "Delete All Bills"}
        </Button>
      </GlassCard>

      {/* Sign Out */}
      <GlassCard className="p-5">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </GlassCard>
    </div>
  );
}