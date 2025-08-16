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
import { Settings, Upload, X } from 'lucide-react';

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
}

interface EditCourseDialogProps {
  course: Course;
  onCourseUpdated: () => void;
}

export const EditCourseDialog: React.FC<EditCourseDialogProps> = ({ course, onCourseUpdated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
  });
  const [objetivos, setObjetivos] = useState<string[]>(course.objetivos || []);
  const [preRequisitos, setPreRequisitos] = useState<string[]>(course.pre_requisitos || []);
  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [novoPreRequisito, setNovoPreRequisito] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('cursos')
        .update({
          ...formData,
          objetivos: objetivos.length > 0 ? objetivos : null,
          pre_requisitos: preRequisitos.length > 0 ? preRequisitos : null,
          updated_at: new Date().toISOString(),
        })
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>
            Faça as alterações necessárias no curso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="inactive">Inativo</SelectItem>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex items-center space-x-2">
            <Switch
              id="certificacao"
              checked={formData.certificacao}
              onCheckedChange={(checked) => setFormData({ ...formData, certificacao: checked })}
            />
            <Label htmlFor="certificacao">Emite certificado de conclusão</Label>
          </div>

          {/* Objetivos */}
          <div className="space-y-2">
            <Label>Objetivos do Curso</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite um objetivo..."
                value={novoObjetivo}
                onChange={(e) => setNovoObjetivo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarObjetivo())}
              />
              <Button type="button" onClick={adicionarObjetivo}>
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
            <div className="flex gap-2">
              <Input
                placeholder="Digite um pré-requisito..."
                value={novoPreRequisito}
                onChange={(e) => setNovoPreRequisito(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarPreRequisito())}
              />
              <Button type="button" onClick={adicionarPreRequisito}>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};