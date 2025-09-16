import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useCourseEnrollmentLimits } from '@/hooks/useCourseEnrollmentLimits';
import { CourseEnrollmentLimitModal } from '@/components/CourseEnrollmentLimitModal';
import { DepartmentLimitsDisplay } from '@/components/DepartmentEnrollmentStatus';
import { applyPhoneMask, removePhoneMask, validateEmailFormat, filterEmailInput } from '@/lib/inputMasks';
import { X, User, Mail, Phone, Building, Briefcase, MapPin, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const createFormSchema = (isCourseEnrollment: boolean) => {
  const baseSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    telefone: z.string()
      .min(1, 'Telefone é obrigatório')
      .refine((value) => {
        const numbers = removePhoneMask(value);
        return numbers.length >= 10 && numbers.length <= 11;
      }, 'Telefone deve ter 10 ou 11 dígitos'),
    empresa_id: z.string().min(1, 'Selecione uma empresa'),
    departamento_id: z.string().min(1, 'Selecione um departamento'),
    cargo: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres'),
    local_id: z.string().min(1, 'Selecione um local'),
  });

  if (isCourseEnrollment) {
    return baseSchema;
  }

  return baseSchema.extend({
    senha: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
      .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
    confirmarSenha: z.string().min(1, 'Confirme sua senha'),
  }).refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });
};

interface ApplicationFormProps {
  onClose: () => void;
  course?: {
    id: string;
    title: string;
  };
}

export const ApplicationForm = ({ onClose, course }: ApplicationFormProps) => {
  const isCourseEnrollment = !!course;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [departmentLimits, setDepartmentLimits] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { companies, loading, getDepartmentsByCompany, getLocationsByCompany } = useCompanyData();
  
  // Hook para controle de vagas do curso
  const {
    status: enrollmentStatus,
    loading: enrollmentLoading,
    courseData,
    checkDepartmentLimit,
  } = useCourseEnrollmentLimits(course?.id || '');

  const formSchema = createFormSchema(isCourseEnrollment);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      empresa_id: '',
      departamento_id: '',
      cargo: '',
      local_id: '',
      ...(isCourseEnrollment ? {} : {
        senha: '',
        confirmarSenha: '',
      }),
    },
  });

  const selectedCompanyId = form.watch('empresa_id');
  const availableDepartments = selectedCompanyId ? getDepartmentsByCompany(selectedCompanyId) : [];
  const availableLocations = selectedCompanyId ? getLocationsByCompany(selectedCompanyId) : [];

  // Aplicar limites usando dados já carregados (sem loops)
  React.useEffect(() => {
    if (isCourseEnrollment && selectedCompanyId && availableDepartments.length > 0 && course?.id && !enrollmentLoading) {
      console.log('🎯 Aplicando limites com dados carregados...');
      
      // HIERARQUIA 1: Verificar limite total do curso primeiro
      if (enrollmentStatus.limitReached) {
        console.log('🚫 CURSO ESGOTADO - Limite total atingido');
        setShowLimitModal(true);
        setDepartmentLimits({}); // Limpar limites de departamento
        return;
      }

      console.log('✅ Curso tem vagas disponíveis no total');

      // HIERARQUIA 2: Aplicar limites por departamento usando dados já processados
      if (courseData?.limite_por_departamento) {
        const limits: { [key: string]: boolean } = {};
        
        availableDepartments.forEach(dept => {
          const isLimitReached = enrollmentStatus.departmentLimitsReached.includes(dept.nome);
          limits[dept.nome] = isLimitReached;
          
          console.log(`🏢 ${dept.nome}: ${isLimitReached ? '🚫 Bloqueado' : '✅ Disponível'}`);
        });
        
        setDepartmentLimits(limits);
        console.log('📋 Limites aplicados:', limits);
      } else {
        console.log('✅ Sem limites por departamento');
        setDepartmentLimits({});
      }
    }
  }, [
    isCourseEnrollment, 
    selectedCompanyId, 
    availableDepartments.length, // Usar length em vez do array completo
    course?.id, 
    enrollmentLoading, 
    enrollmentStatus.limitReached, 
    enrollmentStatus.departmentLimitsReached.length, // Usar length em vez do array completo
    courseData?.limite_por_departamento
  ]);

  // Reset department and location when company changes
  React.useEffect(() => {
    if (selectedCompanyId) {
      form.setValue('departamento_id', '');
      form.setValue('local_id', '');
    }
  }, [selectedCompanyId, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Verificar limites se for inscrição em curso
      if (isCourseEnrollment && course) {
        // Verificar limite total do curso
        if (enrollmentStatus.limitReached) {
          setShowLimitModal(true);
          setIsSubmitting(false);
          return;
        }

        // Verificar limite por departamento
        const selectedDepartment = availableDepartments.find(d => d.id === data.departamento_id);
        if (selectedDepartment) {
          const canEnrollInDepartment = await checkDepartmentLimit(selectedDepartment.nome);
          if (!canEnrollInDepartment) {
            toast({
              title: 'Limite de departamento atingido',
              description: `O departamento ${selectedDepartment.nome} já atingiu o limite máximo de alunos para este curso.`,
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Buscar nomes das entidades selecionadas
      const selectedCompany = companies.find(c => c.id === data.empresa_id);
      const selectedDepartment = availableDepartments.find(d => d.id === data.departamento_id);
      const selectedLocation = availableLocations.find(l => l.id === data.local_id);

      // Clean phone number for storage
      const cleanPhone = removePhoneMask(data.telefone);

      if (isCourseEnrollment && course) {
        // Course enrollment flow - create pending entries in both tables
        console.log('🎯 Inserindo dados na tabela inscricoes_mentoria:', {
          nome: data.nome,
          email: data.email,
          telefone: cleanPhone,
          empresa: selectedCompany?.nome || '',
          departamento: selectedDepartment?.nome || '',
          cargo: data.cargo,
          unidade: selectedLocation?.nome || '',
          status: 'pendente',
          ativo: false,
          curso_nome: course.title,
        });

        const { data: mentoriaData, error: mentoriaError } = await supabase
          .from('inscricoes_mentoria')
          .insert({
            nome: data.nome,
            email: data.email,
            telefone: cleanPhone,
            empresa: selectedCompany?.nome || '',
            departamento: selectedDepartment?.nome || '',
            cargo: data.cargo,
            unidade: selectedLocation?.nome || '',
            status: 'pendente',
            ativo: false,
            curso_nome: course.title,
          })
          .select('id');

        if (mentoriaError) {
          console.error('❌ Erro ao inserir em inscricoes_mentoria:', mentoriaError);
          throw mentoriaError;
        }

        // Defensive check for mentoriaData
        if (!mentoriaData || mentoriaData.length === 0) {
          console.error('❌ Dados de mentoria não retornados após inserção');
          throw new Error('Falha ao criar registro de mentoria');
        }

        console.log('✅ Dados inseridos com sucesso. ID:', mentoriaData[0].id);

        // Create course enrollment
        console.log('🎯 Inserindo inscrição no curso:', {
          aluno_id: mentoriaData[0].id,
          curso_id: course.id,
          status: 'pendente',
        });

        const { error: cursoError } = await supabase
          .from('inscricoes_cursos')
          .insert({
            aluno_id: mentoriaData[0].id,
            curso_id: course.id,
            status: 'pendente',
          });

        if (cursoError) {
          console.error('❌ Erro ao inserir em inscricoes_cursos:', cursoError);
          throw cursoError;
        }

        console.log('✅ Inscrição no curso criada com sucesso');
      } else {
        // Regular user registration flow - rely on database defaults for cleaner insert
        console.log('🎯 Inserindo registro de usuário geral:', {
          nome: data.nome,
          email: data.email,
          telefone: cleanPhone,
          empresa: selectedCompany?.nome || '',
          departamento: selectedDepartment?.nome || '',
          cargo: data.cargo,
          unidade: selectedLocation?.nome || '',
        });

        const { error } = await supabase
          .from('inscricoes_mentoria')
          .insert({
            nome: data.nome,
            email: data.email,
            telefone: cleanPhone,
            empresa: selectedCompany?.nome || '',
            departamento: selectedDepartment?.nome || '',
            cargo: data.cargo,
            unidade: selectedLocation?.nome || '',
            // Rely on database defaults for status, ativo, curso_nome
          });

        if (error) {
          console.error('❌ Erro ao inserir registro geral:', error);
          throw error;
        }

        console.log('✅ Registro de usuário geral criado com sucesso');
      }

      toast({
        title: isCourseEnrollment ? 'Inscrição no curso realizada!' : 'Cadastro realizado com sucesso!',
        description: isCourseEnrollment 
          ? 'Sua inscrição foi enviada para análise. Você receberá um email quando for aprovada.'
          : 'Você receberá um email de confirmação em breve.',
      });

      onClose();
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      toast({
        title: 'Erro ao realizar inscrição',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl">
            {isCourseEnrollment ? `Inscrição no Curso: ${course?.title}` : 'Cadastrar Novo Usuário'}
          </CardTitle>
          <CardDescription>
            {isCourseEnrollment 
              ? 'Preencha seus dados para se inscrever no curso. Após a aprovação, você receberá as instruções de acesso.'
              : 'Preencha os dados para cadastrar um novo usuário no sistema.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nome completo" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          type="text"
                          placeholder="email@exemplo.com" 
                          className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                          {...field}
                          onChange={(e) => {
                            const filteredValue = filterEmailInput(e.target.value);
                            field.onChange(filteredValue);
                            
                            // Validação em tempo real
                            if (filteredValue.length > 0) {
                              if (!validateEmailFormat(filteredValue)) {
                                setEmailError('Formato de e-mail inválido');
                              } else {
                                setEmailError('');
                              }
                            } else {
                              setEmailError('');
                            }
                          }}
                          onBlur={(e) => {
                            field.onBlur();
                            const value = e.target.value;
                            if (value.length > 0 && !validateEmailFormat(value)) {
                              setEmailError('Formato de e-mail inválido');
                            }
                          }}
                        />
                        {emailError && (
                          <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </FormControl>
                    {emailError && (
                      <p className="text-sm text-red-500 mt-1">{emailError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          value={field.value}
                          onChange={(e) => {
                            // Aplica a máscara e limita a entrada
                            const maskedValue = applyPhoneMask(e.target.value);
                            field.onChange(maskedValue);
                          }}
                          onKeyDown={(e) => {
                            // Permite apenas números, backspace, delete, tab, enter, setas
                            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                            const isNumber = /^[0-9]$/.test(e.key);
                            
                            if (!isNumber && !allowedKeys.includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          maxLength={15} // Limite para a máscara completa: (00) 00000-0000
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Digite apenas números. A máscara será aplicada automaticamente.
                    </p>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="empresa_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center">
                              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
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
                  name="departamento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedCompanyId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center">
                              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Selecione o departamento" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDepartments.map((dept) => {
                            const isLimitReached = departmentLimits[dept.nome];
                            return (
                              <SelectItem 
                                key={dept.id} 
                                value={dept.id}
                                disabled={isLimitReached}
                                className={isLimitReached ? "opacity-50" : ""}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{dept.nome}</span>
                                  {isLimitReached && (
                                    <Badge variant="secondary" className="ml-2 text-xs bg-gray-100 text-gray-600">
                                      Limite atingido
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Cargo atual" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="local_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedCompanyId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder={
                                !selectedCompanyId 
                                  ? "Selecione primeiro uma empresa" 
                                  : "Selecione o local"
                              } />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.nome} {location.cidade && `- ${location.cidade}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!isCourseEnrollment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                             type={showPassword ? "text" : "password"}
                             placeholder="Senha para acesso" 
                             className="pl-10 pr-10" 
                             {...field} 
                           />
                           <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                             onClick={() => setShowPassword(!showPassword)}
                           >
                             {showPassword ? (
                               <EyeOff className="h-4 w-4 text-muted-foreground" />
                             ) : (
                               <Eye className="h-4 w-4 text-muted-foreground" />
                             )}
                           </Button>
                         </div>
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Mínimo 6 caracteres, incluindo maiúscula, minúscula, número e caractere especial
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmarSenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                         <div className="relative">
                           <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                           <Input 
                             type={showConfirmPassword ? "text" : "password"}
                             placeholder="Confirme sua senha" 
                             className="pl-10 pr-10" 
                             {...field} 
                           />
                           <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           >
                             {showConfirmPassword ? (
                               <EyeOff className="h-4 w-4 text-muted-foreground" />
                             ) : (
                               <Eye className="h-4 w-4 text-muted-foreground" />
                             )}
                           </Button>
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (isCourseEnrollment ? 'Inscrevendo...' : 'Cadastrando...') 
                    : (isCourseEnrollment ? 'Inscrever-se no Curso' : 'Cadastrar Usuário')
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal de vagas encerradas */}
      {isCourseEnrollment && courseData && (
        <CourseEnrollmentLimitModal
          open={showLimitModal}
          onOpenChange={setShowLimitModal}
          courseName={course?.title || ''}
          totalEnrolled={enrollmentStatus.totalEnrolled}
          maxLimit={courseData.limite_alunos || 0}
        />
      )}
    </div>
  );
};