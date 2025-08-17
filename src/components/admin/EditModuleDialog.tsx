import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Loader2 } from "lucide-react";

interface Module {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  duracao_estimada?: string;
  curso_id: string;
}

interface EditModuleDialogProps {
  module: Module;
  onModuleUpdated: () => void;
}

export const EditModuleDialog: React.FC<EditModuleDialogProps> = ({ module, onModuleUpdated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: module.titulo,
    descricao: module.descricao || '',
    ordem: module.ordem,
    duracao_estimada: module.duracao_estimada || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('curso_modulos')
        .update({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          ordem: formData.ordem,
          duracao_estimada: formData.duracao_estimada || null
        })
        .eq('id', module.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Módulo atualizado',
        description: 'O módulo foi atualizado com sucesso!',
      });

      onModuleUpdated();
      setOpen(false);
      
    } catch (error: any) {
      console.error('Erro ao atualizar módulo:', error);
      toast({
        title: 'Erro ao atualizar módulo',
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
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar Módulo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Módulo</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="duracao_estimada">Duração Estimada</Label>
              <Input
                id="duracao_estimada"
                value={formData.duracao_estimada}
                onChange={(e) => setFormData({ ...formData, duracao_estimada: e.target.value })}
                placeholder="Ex: 2 horas"
              />
            </div>
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
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};