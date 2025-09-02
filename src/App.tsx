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
import { AlterarSenha } from "./pages/AlterarSenha";
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
    
    // Verificar se há tokens de recovery em qualquer parte da URL
    const hasRecoveryTokens = (hash.includes('type=recovery') && hash.includes('access_token')) ||
                             (hash.includes('recovery') && hash.includes('access_token'));
    
    if (hasRecoveryTokens) {
      console.log('App - Tokens de recovery detectados!');
      
      // Se não estamos na página /alterar-senha, redirecionar SEMPRE
      if (pathname !== '/alterar-senha') {
        console.log('App - Redirecionando para /alterar-senha com hash:', hash);
        
        // Forçar navegação para a página de alterar senha
        window.location.href = '/alterar-senha' + hash;
        return;
      }
    }
  }, []);

  // Também verificar mudanças na URL após o carregamento inicial
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      
      console.log('App - Hash mudou:', hash);
      
      if ((hash.includes('type=recovery') || hash.includes('recovery')) && hash.includes('access_token')) {
        if (pathname !== '/alterar-senha') {
          console.log('App - Hash change: Redirecionando para /alterar-senha');
          window.location.href = '/alterar-senha' + hash;
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
            <Route path="/alterar-senha" element={<AlterarSenha />} />
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
