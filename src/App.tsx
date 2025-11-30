import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Check if running as installed PWA (standalone mode)
function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || 
                         (navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Listen for changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkStandalone);
    
    return () => mediaQuery.removeEventListener("change", checkStandalone);
  }, []);

  return isStandalone;
}

// Protected route - requires auth AND must be running as PWA
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isStandalone = useIsStandalone();
  
  // Still checking standalone status
  if (isStandalone === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Not running as PWA - redirect to landing
  if (!isStandalone) {
    return <Navigate to="/" replace />;
  }
  
  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Auth route - only accessible from installed PWA
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isStandalone = useIsStandalone();
  
  // Still checking
  if (isStandalone === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Not running as PWA - redirect to landing
  if (!isStandalone) {
    return <Navigate to="/" replace />;
  }
  
  // Already authenticated - redirect to app
  if (user) {
    return <Navigate to="/app" replace />;
  }
  
  return <>{children}</>;
};

// Landing route - only show if NOT running as PWA
const LandingRoute = ({ children }: { children: React.ReactNode }) => {
  const isStandalone = useIsStandalone();
  
  // Still checking
  if (isStandalone === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Running as PWA - redirect to auth
  if (isStandalone) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <PWAUpdatePrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page - only visible in browser (not installed) */}
            <Route path="/" element={
              <LandingRoute>
                <Landing />
              </LandingRoute>
            } />
            
            {/* Auth page - only accessible from installed PWA */}
            <Route path="/auth" element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            } />
            
            {/* Main app - requires PWA + authentication */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
