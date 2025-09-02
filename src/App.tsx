import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { CourseDetails } from "./pages/CourseDetails";
import { TermsOfUse } from "./pages/TermsOfUse";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { LGPD } from "./pages/LGPD";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Detectar se é um link de recovery e redirecionar se necessário
  useEffect(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    console.log('App - Verificando URL:', window.location.href);
    console.log('App - Hash:', hash);
    console.log('App - Pathname:', pathname);
    
    // Se estamos em qualquer página com hash contendo recovery
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      console.log('App - Link de recovery detectado, redirecionando para /auth');
      
      // Se não estamos já na página /auth, redirecionar
      if (pathname !== '/auth') {
        window.location.href = '/auth' + hash;
        return;
      }
    }
  }, []);

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
