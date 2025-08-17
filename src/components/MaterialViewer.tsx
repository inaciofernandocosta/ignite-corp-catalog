import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Play, 
  File,
  Eye,
  Loader2,
  BookOpen
} from "lucide-react";

interface Material {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  url?: string;
  arquivo_nome?: string;
  formato?: string;
  arquivo_tamanho?: number;
  ordem: number;
  ativo: boolean;
}

interface MaterialViewerProps {
  moduleId: string;
  moduleTitle: string;
  isAdmin?: boolean;
  showTrigger?: boolean;
}

export const MaterialViewer: React.FC<MaterialViewerProps> = ({ 
  moduleId, 
  moduleTitle, 
  isAdmin = false,
  showTrigger = true 
}) => {
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      console.log('MaterialViewer: Buscando materiais para módulo:', moduleId);
      
      const { data, error } = await supabase
        .from('modulo_materiais')
        .select('*')
        .eq('modulo_id', moduleId)
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      
      console.log('MaterialViewer: Materiais encontrados:', data?.length || 0, data);
      setMaterials(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMaterials();
    }
  }, [open, moduleId]);

  // Para componentes sem showTrigger, buscar materiais automaticamente
  useEffect(() => {
    if (!showTrigger) {
      fetchMaterials();
    }
  }, [moduleId, showTrigger]);

  const handleDownload = async (material: Material) => {
    if (!material.url) return;

    setDownloadingIds(prev => new Set(prev).add(material.id));
    
    try {
      // Se é um arquivo do storage, fazer download direto
      if (material.url.includes('supabase') || material.tipo === 'arquivo') {
        const response = await fetch(material.url);
        if (!response.ok) throw new Error('Erro ao baixar arquivo');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.arquivo_nome || `${material.titulo}.${material.formato}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Download iniciado',
          description: `Download do arquivo "${material.titulo}" iniciado com sucesso.`
        });
      } else {
        // Para links externos, abrir em nova aba
        window.open(material.url, '_blank');
      }
    } catch (error: any) {
      console.error('Erro no download:', error);
      toast({
        title: 'Erro no download',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(material.id);
        return newSet;
      });
    }
  };

  const getFileIcon = (tipo: string, formato?: string) => {
    if (tipo === 'video') return <Play className="h-4 w-4" />;
    if (tipo === 'link') return <ExternalLink className="h-4 w-4" />;
    if (formato) {
      const ext = formato.toLowerCase();
      if (['pdf'].includes(ext)) return <FileText className="h-4 w-4" />;
      if (['doc', 'docx'].includes(ext)) return <FileText className="h-4 w-4" />;
      if (['xls', 'xlsx'].includes(ext)) return <FileText className="h-4 w-4" />;
      if (['ppt', 'pptx'].includes(ext)) return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const content = (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando materiais...</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum material encontrado</h3>
          <p className="text-muted-foreground">
            Este módulo ainda não possui materiais disponíveis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getFileIcon(material.tipo, material.formato)}
                      <h4 className="font-medium">{material.titulo}</h4>
                      <Badge variant="outline" className="text-xs">
                        {material.tipo}
                      </Badge>
                      {material.formato && (
                        <Badge variant="secondary" className="text-xs">
                          {material.formato.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    {material.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {material.descricao}
                      </p>
                    )}
                    
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {material.arquivo_tamanho && (
                        <span>Tamanho: {formatFileSize(material.arquivo_tamanho)}</span>
                      )}
                      {material.arquivo_nome && (
                        <span>Arquivo: {material.arquivo_nome}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {material.tipo === 'link' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => material.url && window.open(material.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Link
                      </Button>
                    ) : (
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(material)}
                        disabled={downloadingIds.has(material.id) || !material.url}
                      >
                        {downloadingIds.has(material.id) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloadingIds.has(material.id) ? 'Baixando...' : 'Download'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (!showTrigger) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          Ver Materiais ({materials.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Materiais: {moduleTitle}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};