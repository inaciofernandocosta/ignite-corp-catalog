import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  MapPin, 
  Lock,
  X
} from 'lucide-react';

const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  departamento: z.string().min(1, 'Departamento é obrigatório'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  unidade: z.string().min(1, 'Local é obrigatório'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  status: z.string().default('aprovado'),
});

type CreateUserData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

interface Company {
  id: string;
  nome: string;
}

interface Department {
  id: string;
  nome: string;
  empresa_id: string;
}

interface Location {
  id: string;
  nome: string;
  empresa_id: string;
}

export const CreateUserDialog = ({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      departamento: '',
      cargo: '',
      unidade: '',
      senha: '',
      status: 'aprovado',
    },
  });

  const selectedCompany = form.watch('empresa');

  useEffect(() => {
    if (open) {
      fetchCompaniesAndLocations();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCompany) {
      fetchDepartments(selectedCompany);
    } else {
      setDepartments([]);
    }
    // Reset department when company changes
    form.setValue('departamento', '');
  }, [selectedCompany]);

  const fetchCompaniesAndLocations = async () => {
    try {
      const [companiesResult, locationsResult] = await Promise.all([
        supabase.from('empresas').select('id, nome').eq('status', 'ativo'),
        supabase.from('locais').select('id, nome, empresa_id').eq('status', 'ativo')
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (locationsResult.error) throw locationsResult.error;

      setCompanies(companiesResult.data || []);
      setLocations(locationsResult.data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas e locais:', error);
    }
  };

  const fetchDepartments = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select('id, nome, empresa_id')
        .eq('empresa_id', companyId)
        .eq('status', 'ativo');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
    }
  };

  const onSubmit = async (data: CreateUserData) => {
    setIsSubmitting(true);
    
    try {
      // Get company, department, and location names
      const company = companies.find(c => c.id === data.empresa);
      const department = departments.find(d => d.id === data.departamento);
      const location = locations.find(l => l.id === data.unidade);

      // Create user in inscricoes_mentoria
      const { error } = await supabase
        .from('inscricoes_mentoria')
        .insert({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null,
          empresa: company?.nome || '',
          departamento: department?.nome || '',
          cargo: data.cargo,
          unidade: location?.nome || '',
          status: data.status,
          ativo: true,
          origem: 'admin-cadastro',
        });

      if (error) throw error;

      toast({
        title: 'Usuário cadastrado!',
        description: `${data.nome} foi cadastrado com sucesso.`,
      });

      form.reset();
      onUserCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: error.message || 'Não foi possível cadastrar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLocations = locations.filter(location => 
    location.empresa_id === selectedCompany
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Cadastrar Novo Usuário</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para cadastrar um novo usuário no sistema.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome Completo */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome completo"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone */}
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Empresa e Departamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Selecione a empresa" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedCompany}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Selecione o departamento" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cargo e Local */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cargo atual"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedCompany}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Selecione o local" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Senha e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Senha para acesso"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};