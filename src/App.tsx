import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { CourseDetails } from "./pages/CourseDetails";
import { TermsOfUse } from "./pages/TermsOfUse";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { LGPD } from "./pages/LGPD";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/curso/:slug" element={<CourseDetails />} />
            <Route path="/termos-de-uso" element={<TermsOfUse />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/lgpd" element={<LGPD />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
