import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Certificate } from "@/hooks/useCertificates";
import { useCertificates } from "@/hooks/useCertificates";
import { Eye, Download, FileText, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface StorageCertificateViewerProps {
  certificate: Certificate;
  showControls?: boolean;
}

export const StorageCertificateViewer = ({ certificate, showControls = true }: StorageCertificateViewerProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [certificateImage, setCertificateImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { saveCertificatePDF } = useCertificates();
  const { toast } = useToast();

  // Carregar o template do certificado
  const loadCertificateTemplate = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const img = await loadImageSimple();
      setCertificateImage(img);
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao carregar certificado:', err);
      setError('Erro ao carregar o certificado. Tente novamente.');
      setIsLoading(false);
    }
  };

  // Carregar o certificado quando o modal abrir
  useEffect(() => {
    if (open) {
      loadCertificateTemplate();
    }
  }, [open]);

  // Generate signed URL for private storage access
  const getSignedUrl = useCallback(async (filePath: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('certificados')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Erro ao gerar URL assinada:', error);
        throw new Error('Falha ao gerar URL de acesso');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Erro no getSignedUrl:', error);
      throw error;
    }
  }, []);

  // Image loading function with proper CORS setup
  const loadImageSimple = useCallback(async (): Promise<HTMLImageElement> => {
    return new Promise(async (resolve, reject) => {
      try {
        let imageUrl: string;
        
        // Try to get signed URL for private bucket access
        try {
          imageUrl = await getSignedUrl('Certificado.jpeg');
          console.log('Using signed URL for certificate template');
        } catch (signedUrlError) {
          console.warn('Failed to get signed URL, trying fallback:', signedUrlError);
          // Fallback to a placeholder or local image
          imageUrl = '/placeholder.svg'; // Use Lovable's placeholder
        }

        const img = new Image();
        
        // Set CORS properties for canvas compatibility
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao carregar imagem'));
        }, 15000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(img);
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error('Erro ao carregar imagem:', error);
          reject(new Error('Falha ao carregar a imagem do certificado'));
        };
        
        img.src = imageUrl;
      } catch (err) {
        console.error('Erro geral no loadImageSimple:', err);
        reject(err);
      }
    });
  }, [getSignedUrl]);

  // Gerar o certificado com o nome do aluno
  const generateCertificate = async () => {
    if (!canvasRef.current || !certificateImage) return null;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Definir dimensões do canvas baseadas na imagem
      canvas.width = certificateImage.width;
      canvas.height = certificateImage.height;

      // Desenhar a imagem de fundo
      ctx.drawImage(certificateImage, 0, 0);

      // Desenhar texto - ajustado para o novo design
      // Posicionamento na parte superior do certificado
      const textoX = canvas.width * 0.075; // Ajustado ainda mais para a esquerda
      const textoY = canvas.height * 0.355; // Ajustado para a posição correta
      const textoWidth = canvas.width * 0.65; // Aumentado para acomodar nomes maiores
      const textoHeight = 35; // Altura da linha de texto
      
      // Não precisamos mais do retângulo azul, pois o fundo já é azul
      // ctx.fillStyle = '#0066cc';
      // ctx.fillRect(textoX, textoY - 28, textoWidth, textoHeight);
      
      // Configurar fonte e estilo para o novo texto
      ctx.font = 'bold 28px Arial'; // Aumentado para 28px para melhor legibilidade
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      
      // Desenhar o novo texto completo
      const novoTexto = `Certificamos que ${certificate.aluno_nome || "Aluno"}`;
      ctx.fillText(novoTexto, textoX, textoY);

      try {
        // Tentar obter a URL do canvas
        return canvas.toDataURL('image/jpeg', 0.95);
      } catch (canvasError) {
        console.error('Erro ao gerar toDataURL (Tainted Canvas):', canvasError);
        
        // Tentar usar a imagem original como fallback
        try {
          // Use placeholder image as fallback
          toast({
            title: "Aviso",
            description: "Usando versão simplificada do certificado devido a restrições de segurança.",
            variant: "default"
          });
          
          return '/placeholder.svg'; // Use Lovable's placeholder as fallback
        } catch (fallbackError) {
          console.error('Erro ao usar fallback:', fallbackError);
          toast({
            title: "Erro",
            description: "Não foi possível gerar o certificado. Tente novamente mais tarde.",
            variant: "destructive"
          });
          return null;
        }
      }
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
      return null;
    }
  };

  // Gerar e baixar o PDF
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      if (!certificateImage) {
        await loadCertificateTemplate();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const dataUrl = await generateCertificate();
      if (!dataUrl) {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o certificado.",
          variant: "destructive"
        });
        return;
      }
      
      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const imgHeight = 210;
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`certificado-${certificate.aluno_nome}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Certificado baixado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o PDF do certificado.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Salvar o certificado no banco de dados
  const handleSavePDF = async () => {
    setIsSaving(true);
    
    try {
      if (!certificateImage) {
        await loadCertificateTemplate();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const dataUrl = await generateCertificate();
      if (!dataUrl) {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o certificado.",
          variant: "destructive"
        });
        return;
      }
      
      // Salvar no banco de dados
      const success = await saveCertificatePDF(certificate.id, dataUrl);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Certificado salvo no banco de dados com sucesso!",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar certificado:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o certificado no banco de dados.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white w-full"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4 mr-2" />
        Ver Certificado
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificado de {certificate.aluno_nome}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Visualize, baixe ou salve o certificado de conclusão do curso
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="relative w-full aspect-[1.414/1] bg-slate-700 rounded-lg overflow-hidden flex justify-center items-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-white gap-2">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  <p>Carregando certificado...</p>
                  <p className="text-sm text-gray-400">Aguarde, processando imagem...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center text-white gap-2">
                  <p className="text-red-400">{error}</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={loadCertificateTemplate}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              ) : certificateImage ? (
                <>
                  <canvas 
                    ref={canvasRef} 
                    className="max-w-full max-h-full object-contain"
                    style={{ display: 'none' }}
                  />
                  {/* Exibir apenas o canvas, não tentar renderizar a imagem com generateCertificate */}
                  <img 
                    ref={(el) => {
                      // Quando o componente montar, renderizar o certificado no canvas e exibir
                      if (el && certificateImage) {
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext('2d');
                        if (ctx) {
                          // Configurar canvas
                          canvas.width = certificateImage.width;
                          canvas.height = certificateImage.height;
                          
                          // Desenhar imagem
                          ctx.drawImage(certificateImage, 0, 0);
                          
                          // Desenhar texto - ajustado para o novo design
                          // Posicionamento na parte superior do certificado
                          const textoX = canvas.width * 0.075; // Ajustado ainda mais para a esquerda
                          const textoY = canvas.height * 0.355; // Mantido na mesma altura
                          const textoWidth = canvas.width * 0.65; // Aumentado para acomodar nomes maiores
                          const textoHeight = 35;
                          
                          // Não precisamos mais do retângulo azul, pois o fundo já é azul
                          // ctx.fillStyle = '#0066cc';
                          // ctx.fillRect(textoX, textoY - 28, textoWidth, textoHeight);
                          
                          ctx.font = '28px Arial'; // Sem negrito e mantendo o tamanho para legibilidade
                          ctx.fillStyle = 'white';
                          ctx.textAlign = 'left';
                          
                          const novoTexto = `Certificamos que ${certificate.aluno_nome || "Aluno"} `;
                          ctx.fillText(novoTexto, textoX, textoY);
                          
                          // Usar o canvas como fonte da imagem
                          try {
                            el.src = canvas.toDataURL('image/jpeg', 0.95);
                          } catch (err) {
                            console.error('Erro ao gerar toDataURL (Tainted Canvas):', err);
                            // Mostrar mensagem de erro
                            toast({
                              title: "Erro de segurança CORS",
                              description: "Não foi possível gerar o certificado devido a restrições de segurança.",
                              variant: "destructive"
                            });
                            // Exibir apenas a imagem original como fallback
                            el.src = certificateImage.src;
                          }
                        }
                      }
                    }}
                    alt={`Certificado de ${certificate.aluno_nome}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </>
              ) : (
                <div className="text-white">Erro ao carregar certificado</div>
              )}
            </div>
            
            {showControls && (
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSavePDF}
                  disabled={isSaving || isGenerating || !certificateImage || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[150px] text-white font-medium"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar no Banco
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating || isSaving || !certificateImage || isLoading}
                  className="bg-green-600 hover:bg-green-700 min-w-[170px]"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Certificado
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};