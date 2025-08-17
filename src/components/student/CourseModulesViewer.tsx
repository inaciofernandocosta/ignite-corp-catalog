import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  Clock, 
  Hash, 
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { MaterialViewer } from "../MaterialViewer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Module {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  duracao_estimada?: string;
  curso_id: string;
}

interface CourseModulesViewerProps {
  courseId: string;
  courseTitle: string;
}

export const CourseModulesViewer: React.FC<CourseModulesViewerProps> = ({ 
  courseId, 
  courseTitle 
}) => {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (open) {
      fetchModules();
    }
  }, [open, courseId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <BookOpen className="h-4 w-4 mr-2" />
          Ver Conteúdo do Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {courseTitle} - Módulos e Materiais
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando módulos...</span>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum módulo encontrado</h3>
            <p className="text-muted-foreground">
              Este curso ainda não possui módulos disponíveis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => (
              <Card key={module.id} className="overflow-hidden">
                <Collapsible 
                  open={expandedModules.has(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 text-left">
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
                        <div className="ml-4">
                          {expandedModules.has(module.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t">
                      <div className="mt-4">
                        <MaterialViewer
                          moduleId={module.id}
                          moduleTitle={module.titulo}
                          isAdmin={false}
                          showTrigger={false}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};