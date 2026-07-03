import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Download from "./pages/Download";

const queryClient = new QueryClient();

// Desktop (Electron) loads from file:// → HashRouter; web uses BrowserRouter.
const Router = __DESKTOP__ ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          {/* Desktop boots straight into the app; web shows the Landing page. */}
          <Route
            path="/"
            element={
              __DESKTOP__ ? (
                <Navigate to="/app" replace />
              ) : (
                <PageTransition><Landing /></PageTransition>
              )
            }
          />
          <Route path="/app" element={<PageTransition><Index /></PageTransition>} />
          <Route
            path="/download"
            element={
              __DESKTOP__ ? (
                <Navigate to="/app" replace />
              ) : (
                <PageTransition><Download /></PageTransition>
              )
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
