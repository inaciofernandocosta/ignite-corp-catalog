import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Upload, X, ImageIcon, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  duracao: string;
  nivel: string;
  status: string;
  imagem_capa: string;
  objetivos: string[] | null;
  pre_requisitos: string[] | null;
  certificacao: boolean;
  preco: number;
  data_inicio: string | null;
  data_fim: string | null;
  limite_alunos: number | null;
  limite_por_departamento: number | null;
  certificado_template: string | null;
}

interface EditCourseDialogProps {
  course: Course;
  onCourseUpdated: () => void;
}

export const EditCourseDialog: React.FC<EditCourseDialogProps> = ({ course, onCourseUpdated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(course.imagem_capa);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    titulo: course.titulo,
    descricao: course.descricao,
    duracao: course.duracao,
    nivel: course.nivel,
    status: course.status,
    certificacao: course.certificacao,
    preco: course.preco,
    data_inicio: course.data_inicio || '',
    data_fim: course.data_fim || '',
    imagem_capa: course.imagem_capa || '',
    limite_alunos: course.limite_alunos || '',
    limite_por_departamento: course.limite_por_departamento || '',
    certificado_template: course.certificado_template || '',
  });

  // Update form data when course prop changes
  useEffect(() => {
    setFormData({
      titulo: course.titulo,
      descricao: course.descricao,
      duracao: course.duracao,
      nivel: course.nivel,
      status: course.status,
      certificacao: course.certificacao,
      preco: course.preco,
      data_inicio: course.data_inicio || '',
      data_fim: course.data_fim || '',
      imagem_capa: course.imagem_capa || '',
      limite_alunos: course.limite_alunos || '',
      limite_por_departamento: course.limite_por_departamento || '',
      certificado_template: course.certificado_template || '',
    });
    setImagePreview(course.imagem_capa);
  }, [course]);
  const [objetivos, setObjetivos] = useState<string[]>(course.objetivos || []);
  const [preRequisitos, setPreRequisitos] = useState<string[]>(course.pre_requisitos || []);
  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [novoPreRequisito, setNovoPreRequisito] = useState('');
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('course-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao fazer upload da imagem',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione uma imagem.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem menor que 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imagem_capa: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.imagem_capa;

      // Upload new image if selected
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Preparar dados para update
      const updateData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        duracao: formData.duracao,
        nivel: formData.nivel,
        status: formData.status,
        certificacao: formData.certificacao,
        preco: formData.preco,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        imagem_capa: imageUrl || null,
        objetivos: objetivos.length > 0 ? objetivos : null,
        pre_requisitos: preRequisitos.length > 0 ? preRequisitos : null,
        limite_alunos: formData.limite_alunos ? parseInt(formData.limite_alunos.toString()) : null,
        limite_por_departamento: formData.limite_por_departamento ? parseInt(formData.limite_por_departamento.toString()) : null,
        certificado_template: formData.certificado_template || null,
      };

      const { error } = await supabase
        .from('cursos')
        .update(updateData)
        .eq('id', course.id);

      if (error) throw error;

      toast({
        title: 'Curso atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });

      onCourseUpdated();
      setOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast({
        title: 'Erro ao atualizar curso',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarObjetivo = () => {
    if (novoObjetivo.trim()) {
      setObjetivos([...objetivos, novoObjetivo.trim()]);
      setNovoObjetivo('');
    }
  };

  const removerObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index));
  };

  const adicionarPreRequisito = () => {
    if (novoPreRequisito.trim()) {
      setPreRequisitos([...preRequisitos, novoPreRequisito.trim()]);
      setNovoPreRequisito('');
    }
  };

  const removerPreRequisito = (index: number) => {
    setPreRequisitos(preRequisitos.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1">
          <Settings className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias no curso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Imagem do Curso</Label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview do curso" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">Nenhuma imagem selecionada</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1"
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <Button disabled className="min-w-24">
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Curso *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração *</Label>
              <Input
                id="duracao"
                placeholder="Ex: 5 horas, 2 dias"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o curso..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nivel">Nível *</Label>
              <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Básico">Básico</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limite_alunos">Limite Total de Alunos</Label>
              <Input
                id="limite_alunos"
                type="number"
                min="1"
                placeholder="Ex: 50"
                value={formData.limite_alunos}
                onChange={(e) => setFormData({ ...formData, limite_alunos: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de alunos no curso (deixe vazio para ilimitado)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_por_departamento">Limite por Departamento</Label>
              <Input
                id="limite_por_departamento"
                type="number"
                min="1"
                placeholder="Ex: 5"
                value={formData.limite_por_departamento}
                onChange={(e) => setFormData({ ...formData, limite_por_departamento: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de alunos por departamento (deixe vazio para ilimitado)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          {/* Certificação e Template */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="certificacao"
                checked={formData.certificacao}
                onCheckedChange={(checked) => setFormData({ ...formData, certificacao: checked })}
              />
              <Label htmlFor="certificacao">Emite certificado de conclusão</Label>
            </div>

            {formData.certificacao && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <Label htmlFor="certificado_template" className="text-sm font-medium">
                  Template do Certificado
                </Label>
                <Input
                  id="certificado_template"
                  placeholder="Cole aqui a URL da imagem do certificado (ex: https://...)"
                  value={formData.certificado_template}
                  onChange={(e) => setFormData({ ...formData, certificado_template: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  📋 Cole a URL completa da imagem do certificado que será usado para este curso.
                  <br />
                  Exemplo: https://fauoxtziffljgictcvhi.supabase.co/storage/v1/object/public/certificados/17.09%20-%20certificado.png
                </p>
              </div>
            )}
          </div>

          {/* Objetivos */}
          <div className="space-y-2">
            <Label>Objetivos do Curso</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Digite um objetivo..."
                value={novoObjetivo}
                onChange={(e) => setNovoObjetivo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarObjetivo())}
                className="flex-1"
              />
              <Button type="button" onClick={adicionarObjetivo} className="sm:w-auto">
                Adicionar
              </Button>
            </div>
            {objetivos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {objetivos.map((objetivo, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {objetivo}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removerObjetivo(index)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pré-requisitos */}
          <div className="space-y-2">
            <Label>Pré-requisitos</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Digite um pré-requisito..."
                value={novoPreRequisito}
                onChange={(e) => setNovoPreRequisito(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarPreRequisito())}
                className="flex-1"
              />
              <Button type="button" onClick={adicionarPreRequisito} className="sm:w-auto">
                Adicionar
              </Button>
            </div>
            {preRequisitos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {preRequisitos.map((req, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {req}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removerPreRequisito(index)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="order-2 sm:order-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploadingImage} className="order-1 sm:order-2">
              {loading ? 'Salvando...' : uploadingImage ? 'Processando imagem...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};