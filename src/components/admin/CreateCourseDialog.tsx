import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocais } from '@/hooks/useLocais';
import { cn } from '@/lib/utils';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  data_inicio: z.date().optional(),
  data_fim: z.date().optional(),
  local_id: z.string().optional(),
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { locais, loading: locaisLoading } = useLocais();

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
      data_inicio: undefined,
      data_fim: undefined,
      local_id: '',
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const uploadImage = async (courseId: string): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${courseId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Primeiro criar o curso para obter o ID
      const courseData = {
        titulo: data.titulo,
        descricao: data.descricao,
        duracao: data.duracao,
        nivel: data.nivel,
        status: data.status,
        certificacao: data.certificacao,
        preco: data.preco,
        slug: data.slug || generateSlug(data.titulo),
        data_inicio: data.data_inicio ? data.data_inicio.toISOString().split('T')[0] : null,
        data_fim: data.data_fim ? data.data_fim.toISOString().split('T')[0] : null,
        local_id: data.local_id || null,
        objetivos: objetivos.length > 0 ? objetivos : null,
        pre_requisitos: preRequisitos.length > 0 ? preRequisitos : null,
      };

      const { data: insertedCourse, error } = await supabase
        .from('cursos')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;

      // Se há imagem, fazer upload e atualizar o curso
      if (imageFile && insertedCourse) {
        const imageUrl = await uploadImage(insertedCourse.id);
        if (imageUrl) {
          const { error: updateError } = await supabase
            .from('cursos')
            .update({ imagem_capa: imageUrl })
            .eq('id', insertedCourse.id);

          if (updateError) {
            console.error('Error updating course image:', updateError);
          }
        }
      }

      toast({
        title: 'Curso criado com sucesso!',
        description: `O curso "${data.titulo}" foi criado.`,
      });

      form.reset();
      setObjetivos([]);
      setPreRequisitos([]);
      setImageFile(null);
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="local_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local do Curso</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um local" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locais.map((local) => (
                        <SelectItem key={local.id} value={local.id}>
                          {local.nome} - {local.cidade}, {local.estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Imagem de Capa</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {imageFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {imageFile.name}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Faça upload da imagem que será exibida como capa do curso
              </FormDescription>
            </FormItem>

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