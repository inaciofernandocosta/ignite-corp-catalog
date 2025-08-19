import React, { useState, useEffect } from 'react';
import { removeBackground, loadImage } from '../lib/backgroundRemoval';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const LogoProcessor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);

  const processLogo = async () => {
    setIsProcessing(true);
    try {
      // Load the original logo
      const response = await fetch('/src/assets/logo-original.png');
      const blob = await response.blob();
      const imageElement = await loadImage(blob);
      
      // Remove background
      const processedBlob = await removeBackground(imageElement);
      
      // Create URL for the processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedLogo(processedUrl);
      
      // Download the processed image
      const link = document.createElement('a');
      link.href = processedUrl;
      link.download = 'logo-transparent.png';
      link.click();
      
      toast.success('Logo processado com sucesso! Fundo removido.');
    } catch (error) {
      console.error('Erro ao processar logo:', error);
      toast.error('Erro ao processar o logo. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Processador de Logo</h3>
      <p className="text-sm text-muted-foreground">
        Clique para processar o logo e remover o fundo automaticamente.
      </p>
      
      <Button 
        onClick={processLogo} 
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processando...' : 'Processar Logo (Remover Fundo)'}
      </Button>
      
      {processedLogo && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Logo com fundo transparente:</p>
          <img 
            src={processedLogo} 
            alt="Logo processado" 
            className="max-w-full h-auto border rounded"
            style={{ backgroundColor: '#f0f0f0' }}
          />
        </div>
      )}
    </div>
  );
};