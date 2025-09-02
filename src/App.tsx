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
    const fullUrl = window.location.href;
    const hash = window.location.hash;
    const search = window.location.search;
    const pathname = window.location.pathname;
    
    console.log('=== VERIFICANDO RECOVERY MODE ===');
    console.log('App - URL completa:', fullUrl);
    console.log('App - Hash:', hash);
    console.log('App - Search:', search);
    console.log('App - Pathname:', pathname);
    
    // Verificar tokens de recovery em hash OU search params
    const hasRecoveryInHash = hash.includes('type=recovery') && hash.includes('access_token');
    const hasRecoveryInSearch = search.includes('type=recovery') && search.includes('access_token');
    const hasRecoveryTokens = hasRecoveryInHash || hasRecoveryInSearch;
    
    console.log('App - Recovery no hash:', hasRecoveryInHash);
    console.log('App - Recovery no search:', hasRecoveryInSearch);
    console.log('App - Tem tokens de recovery:', hasRecoveryTokens);
    
    if (hasRecoveryTokens) {
      console.log('App - 🔐 TOKENS DE RECOVERY DETECTADOS!');
      
      // Se não estamos na página /alterar-senha, redirecionar SEMPRE
      if (pathname !== '/alterar-senha') {
        console.log('App - ➡️ Redirecionando para /alterar-senha');
        
        // Preservar todos os parâmetros (hash + search)
        const queryString = hash || search;
        const targetUrl = '/alterar-senha' + queryString;
        
        console.log('App - URL destino:', targetUrl);
        
        // Forçar navegação para a página de alterar senha
        window.location.href = targetUrl;
        return;
      } else {
        console.log('App - ✅ Já estamos na página /alterar-senha');
      }
    } else {
      console.log('App - ❌ Nenhum token de recovery encontrado');
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
