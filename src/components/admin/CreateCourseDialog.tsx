import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

const formSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  duracao: z.string().min(1, 'Duração é obrigatória'),
  nivel: z.enum(['básico', 'intermediário', 'avançado']),
  status: z.enum(['draft', 'active', 'inactive']),
  certificacao: z.boolean(),
  preco: z.number().default(0),
  slug: z.string().optional(),
  imagem_capa: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCourseDialogProps {
  onCourseCreated?: () => void;
}

export const CreateCourseDialog = ({ onCourseCreated }: CreateCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [preRequisitos, setPreRequisitos] = useState<string[]>([]);
  const [newObjetivo, setNewObjetivo] = useState('');
  const [newPreRequisito, setNewPreRequisito] = useState('');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      duracao: '',
      nivel: 'básico',
      status: 'draft',
      certificacao: false,
      preco: 0,
      slug: '',
      imagem_capa: '',
    },
  });

  const generateSlug = (titulo: string) => {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const addObjetivo = () => {
    if (newObjetivo.trim() && !objetivos.includes(newObjetivo.trim())) {
      setObjetivos([...objetivos, newObjetivo.trim()]);
      setNewObjetivo('');
    }
  };

  const removeObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index));
  };

  const addPreRequisito = () => {
    if (newPreRequisito.trim() && !preRequisitos.includes(newPreRequisito.trim())) {
      setPreRequisitos([...preRequisitos, newPreRequisito.trim()]);
      setNewPreRequisito('');
    }
  };

  const removePreRequisito = (index: number) => {
    setPreRequisitos(preRequisitos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const courseData = {
        titulo: data.titulo,
        descricao: data.descricao,
        duracao: data.duracao,
        nivel: data.nivel,
        status: data.status,
        certificacao: data.certificacao,
        preco: data.preco,
        slug: data.slug || generateSlug(data.titulo),
        imagem_capa: data.imagem_capa || null,
        objetivos: objetivos.length > 0 ? objetivos : null,
        pre_requisitos: preRequisitos.length > 0 ? preRequisitos : null,
      };

      const { error } = await supabase
        .from('cursos')
        .insert(courseData);

      if (error) throw error;

      toast({
        title: 'Curso criado com sucesso!',
        description: `O curso "${data.titulo}" foi criado.`,
      });

      form.reset();
      setObjetivos([]);
      setPreRequisitos([]);
      setOpen(false);
      onCourseCreated?.();
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast({
        title: 'Erro ao criar curso',
        description: 'Ocorreu um erro ao criar o curso. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Curso</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo curso
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título do Curso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: IA na Prática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ia-na-pratica" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!e.target.value && form.getValues('titulo')) {
                            field.onChange(generateSlug(form.getValues('titulo')));
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe vazio para gerar automaticamente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2 dias" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="básico">Básico</SelectItem>
                        <SelectItem value="intermediário">Intermediário</SelectItem>
                        <SelectItem value="avançado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o curso..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                       <Input 
                         type="number" 
                         step="0.01" 
                         placeholder="0.00" 
                         {...field}
                         onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificacao"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Certificação</FormLabel>
                      <FormDescription>
                        Oferece certificado de conclusão
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imagem_capa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem de Capa</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/imagem.jpg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL da imagem que será exibida como capa do curso
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Objetivos */}
            <div className="space-y-3">
              <FormLabel>Objetivos do Curso</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar objetivo..."
                  value={newObjetivo}
                  onChange={(e) => setNewObjetivo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjetivo())}
                />
                <Button type="button" onClick={addObjetivo} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {objetivos.map((objetivo, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {objetivo}
                    <button
                      type="button"
                      onClick={() => removeObjetivo(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pré-requisitos */}
            <div className="space-y-3">
              <FormLabel>Pré-requisitos</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar pré-requisito..."
                  value={newPreRequisito}
                  onChange={(e) => setNewPreRequisito(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreRequisito())}
                />
                <Button type="button" onClick={addPreRequisito} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preRequisitos.map((requisito, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {requisito}
                    <button
                      type="button"
                      onClick={() => removePreRequisito(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Curso'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};