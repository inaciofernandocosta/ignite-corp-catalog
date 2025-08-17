import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";

interface CreateModuleDialogProps {
  courseId: string;
  courseTitle: string;
  onModuleCreated: () => void;
}

export const CreateModuleDialog: React.FC<CreateModuleDialogProps> = ({ 
  courseId, 
  courseTitle, 
  onModuleCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    ordem: 1,
    duracao_estimada: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar a próxima ordem automaticamente
      const { data: existingModules } = await supabase
        .from('curso_modulos')
        .select('ordem')
        .eq('curso_id', courseId)
        .order('ordem', { ascending: false })
        .limit(1);

      const nextOrder = existingModules && existingModules.length > 0 
        ? existingModules[0].ordem + 1 
        : 1;

      const { error } = await supabase
        .from('curso_modulos')
        .insert({
          curso_id: courseId,
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          ordem: nextOrder,
          duracao_estimada: formData.duracao_estimada || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Módulo criado',
        description: 'O módulo foi criado com sucesso!',
      });

      setFormData({
        titulo: '',
        descricao: '',
        ordem: 1,
        duracao_estimada: ''
      });
      
      onModuleCreated();
      setOpen(false);
      
    } catch (error: any) {
      console.error('Erro ao criar módulo:', error);
      toast({
        title: 'Erro ao criar módulo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Módulo - {courseTitle}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Módulo</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              placeholder="Digite o título do módulo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Digite a descrição do módulo (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao_estimada">Duração Estimada</Label>
            <Input
              id="duracao_estimada"
              value={formData.duracao_estimada}
              onChange={(e) => setFormData({ ...formData, duracao_estimada: e.target.value })}
              placeholder="Ex: 2 horas, 30 minutos"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Módulo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};