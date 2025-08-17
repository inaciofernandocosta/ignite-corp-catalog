import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Edit, FileText, Trash2, Clock, Hash } from "lucide-react";
import { EditModuleDialog } from "./EditModuleDialog";
import { ManageModuleMaterialsDialog } from "./ManageModuleMaterialsDialog";
import { MaterialViewer } from "../MaterialViewer";

interface Module {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  duracao_estimada?: string;
  curso_id: string;
}

interface ViewModulesDialogProps {
  courseId: string;
  courseTitle: string;
  onModuleUpdated?: () => void;
}

export const ViewModulesDialog: React.FC<ViewModulesDialogProps> = ({ 
  courseId, 
  courseTitle, 
  onModuleUpdated 
}) => {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('curso_modulos')
        .select('*')
        .eq('curso_id', courseId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar módulos:', error);
      toast({
        title: 'Erro ao carregar módulos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o módulo "${moduleTitle}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('curso_modulos')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      toast({
        title: 'Módulo excluído',
        description: 'O módulo foi excluído com sucesso!',
      });

      fetchModules();
      onModuleUpdated?.();
    } catch (error: any) {
      console.error('Erro ao excluir módulo:', error);
      toast({
        title: 'Erro ao excluir módulo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleModuleUpdated = () => {
    fetchModules();
    onModuleUpdated?.();
  };

  useEffect(() => {
    if (open) {
      fetchModules();
    }
  }, [open, courseId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Módulos ({modules.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Módulos do Curso: {courseTitle}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum módulo encontrado</h3>
            <p className="text-muted-foreground">
              Este curso ainda não possui módulos cadastrados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-fit">
                          <Hash className="h-3 w-3 mr-1" />
                          {module.ordem}
                        </Badge>
                        <CardTitle className="text-lg">{module.titulo}</CardTitle>
                      </div>
                      {module.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {module.descricao}
                        </p>
                      )}
                      {module.duracao_estimada && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {module.duracao_estimada}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <EditModuleDialog 
                      module={module} 
                      onModuleUpdated={handleModuleUpdated} 
                    />
                    <ManageModuleMaterialsDialog 
                      moduleId={module.id}
                      moduleTitle={module.titulo}
                      onMaterialsUpdated={handleModuleUpdated}
                    />
                    <MaterialViewer
                      moduleId={module.id}
                      moduleTitle={module.titulo}
                      isAdmin={true}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteModule(module.id, module.titulo)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};