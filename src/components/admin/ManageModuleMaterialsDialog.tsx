import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

interface ManageModuleMaterialsDialogProps {
  moduleId: string;
  moduleTitle: string;
  onMaterialsUpdated: () => void;
}

export const ManageModuleMaterialsDialog: React.FC<ManageModuleMaterialsDialogProps> = ({
  moduleId,
  moduleTitle,
  onMaterialsUpdated
}) => {
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'arquivo',
    url: '',
    ordem: 1
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('modulo_materiais')
        .select('*')
        .eq('modulo_id', moduleId)
        .order('ordem');

      if (error) throw error;
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

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${moduleId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('modulo-materiais')
        .upload(filePath, file);

      if (error) throw error;

      // Para bucket privado, retornar o caminho do arquivo em vez da URL pública
      const fileUrl = `https://fauoxtziffljgictcvhi.supabase.co/storage/v1/object/public/modulo-materiais/${filePath}`;

      return fileUrl;
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = formData.url;
      let fileName = null;
      let fileSize = null;
      let fileFormat = null;

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        if (!fileUrl) return;
        
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        fileFormat = selectedFile.name.split('.').pop()?.toLowerCase();
      }

      const materialData = {
        modulo_id: moduleId,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipo: formData.tipo,
        url: fileUrl,
        arquivo_nome: fileName,
        arquivo_tamanho: fileSize,
        formato: fileFormat,
        ordem: formData.ordem,
        ativo: true
      };

      if (editingMaterial) {
        const { error } = await supabase
          .from('modulo_materiais')
          .update(materialData)
          .eq('id', editingMaterial.id);
        
        if (error) throw error;
        
        toast({
          title: 'Material atualizado',
          description: 'O material foi atualizado com sucesso!'
        });
      } else {
        const { error } = await supabase
          .from('modulo_materiais')
          .insert(materialData);
        
        if (error) throw error;
        
        toast({
          title: 'Material criado',
          description: 'O material foi criado com sucesso!'
        });
      }

      resetForm();
      fetchMaterials();
      onMaterialsUpdated();
      
    } catch (error: any) {
      console.error('Erro ao salvar material:', error);
      toast({
        title: 'Erro ao salvar material',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('modulo_materiais')
        .delete()
        .eq('id', materialId);

      if (error) throw error;
      
      toast({
        title: 'Material removido',
        description: 'O material foi removido com sucesso!'
      });
      
      fetchMaterials();
      onMaterialsUpdated();
    } catch (error: any) {
      console.error('Erro ao remover material:', error);
      toast({
        title: 'Erro ao remover material',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'arquivo',
      url: '',
      ordem: materials.length + 1
    });
    setSelectedFile(null);
    setEditingMaterial(null);
    setShowAddForm(false);
  };

  const startEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      titulo: material.titulo,
      descricao: material.descricao || '',
      tipo: material.tipo,
      url: material.url || '',
      ordem: material.ordem
    });
    setShowAddForm(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Gerenciar Materiais
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Materiais - {moduleTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Novo Material
            </Button>
          )}

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingMaterial ? 'Editar Material' : 'Novo Material'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        required
                        placeholder="Digite o título do material"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arquivo">Arquivo</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="documento">Documento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Digite a descrição do material (opcional)"
                      rows={2}
                    />
                  </div>

                  {formData.tipo === 'arquivo' ? (
                    <div className="space-y-2">
                      <Label htmlFor="file">Arquivo</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                      />
                      {uploadingFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fazendo upload...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="Digite a URL do material"
                        type="url"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="ordem">Ordem</Label>
                    <Input
                      id="ordem"
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                      required
                      min="1"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading || uploadingFile}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingMaterial ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Materiais do Módulo</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum material encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map((material) => (
                  <Card key={material.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <h4 className="font-medium">{material.titulo}</h4>
                            <Badge variant="outline" className="text-xs">
                              {material.tipo}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              #{material.ordem}
                            </Badge>
                          </div>
                          {material.descricao && (
                            <p className="text-sm text-muted-foreground">
                              {material.descricao}
                            </p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {material.formato && (
                              <span>Formato: {material.formato.toUpperCase()}</span>
                            )}
                            {material.arquivo_tamanho && (
                              <span>Tamanho: {formatFileSize(material.arquivo_tamanho)}</span>
                            )}
                          </div>
                        </div>
                        
                         <div className="flex gap-2">
                           {material.url && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => window.open(material.url, '_blank')}
                             >
                               <Upload className="h-4 w-4" />
                             </Button>
                           )}
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => startEdit(material)}
                           >
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o material "{material.titulo}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(material.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};