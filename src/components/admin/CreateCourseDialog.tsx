import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload, ImageIcon, Trash2 } from 'lucide-react';
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
  nivel: z.enum(['Básico', 'Intermediário', 'Avançado']),
  status: z.enum(['draft', 'active', 'archived']),
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const { locais, loading: locaisLoading } = useLocais();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      duracao: '',
      nivel: 'Básico',
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

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (courseId: string): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${courseId}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
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

  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const { data: existingCourse } = await supabase
        .from('cursos')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!existingCourse) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Gerar slug único
      const baseSlug = data.slug || generateSlug(data.titulo);
      const uniqueSlug = await generateUniqueSlug(baseSlug);

      // Primeiro criar o curso para obter o ID
      const courseData = {
        titulo: data.titulo,
        descricao: data.descricao,
        duracao: data.duracao,
        nivel: data.nivel,
        status: data.status,
        certificacao: data.certificacao,
        preco: data.preco,
        slug: uniqueSlug,
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
      setImagePreview(null);
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
            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Imagem do Curso</label>
                
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
                    onChange={handleImageUpload}
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
            </div>

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
                        <SelectItem value="Básico">Básico</SelectItem>
                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                        <SelectItem value="Avançado">Avançado</SelectItem>
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
                        <SelectItem value="archived">Arquivado</SelectItem>
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

            {/* Objetivos */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Objetivos do Curso</label>
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
            </div>

            {/* Pré-requisitos */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pré-requisitos</label>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || uploadingImage}>
                {loading ? 'Criando...' : uploadingImage ? 'Processando imagem...' : 'Criar Curso'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};