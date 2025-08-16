import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyData } from '@/hooks/useCompanyData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Building, Briefcase, MapPin, Settings } from 'lucide-react';

interface UserProfileProps {
  trigger?: React.ReactNode;
}

export const UserProfile: React.FC<UserProfileProps> = ({ trigger }) => {
  const { profile } = useAuth();
  const { companies, departments, locations, loading: companyDataLoading, getDepartmentsByCompany, getLocationsByCompany } = useCompanyData();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    departamento: '',
    cargo: '',
    unidade: '',
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        nome: profile.nome || '',
        empresa: profile.empresa || '',
        departamento: profile.departamento || '',
        cargo: profile.cargo || '',
        unidade: profile.unidade || '',
      });

      // Find company ID by name
      const company = companies.find(c => c.nome === profile.empresa);
      if (company) {
        setSelectedCompanyId(company.id);
      }
    }
  }, [profile, isOpen, companies]);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setFormData(prev => ({
        ...prev,
        empresa: company.nome,
        departamento: '',
        unidade: '',
      }));
    }
  };

  const handleDepartmentChange = (departmentName: string) => {
    setFormData(prev => ({
      ...prev,
      departamento: departmentName,
    }));
  };

  const handleLocationChange = (locationName: string) => {
    setFormData(prev => ({
      ...prev,
      unidade: locationName,
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('inscricoes_mentoria')
        .update({
          nome: formData.nome,
          empresa: formData.empresa,
          departamento: formData.departamento,
          cargo: formData.cargo,
          unidade: formData.unidade,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso. Faça login novamente para ver as atualizações.",
      });
      
      setIsEditing(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <User className="w-4 h-4" />
      Meu Perfil
    </Button>
  );

  const availableDepartments = selectedCompanyId ? getDepartmentsByCompany(selectedCompanyId) : [];
  const availableLocations = selectedCompanyId ? getLocationsByCompany(selectedCompanyId) : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Meu Perfil
          </DialogTitle>
          <DialogDescription>
            Visualize e edite suas informações pessoais. O email não pode ser alterado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg font-semibold">
                {profile?.nome ? getInitials(profile.nome) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{profile?.nome || 'Nome não informado'}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </p>
            </div>
            <Button
              variant={isEditing ? "destructive" : "outline"}
              onClick={() => {
                if (isEditing) {
                  // Reset form data
                  setFormData({
                    nome: profile?.nome || '',
                    empresa: profile?.empresa || '',
                    departamento: profile?.departamento || '',
                    cargo: profile?.cargo || '',
                    unidade: profile?.unidade || '',
                  });
                }
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Pessoais</CardTitle>
              <CardDescription>
                Suas informações básicas de identificação
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="pl-10 bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado pois é usado como identificador único.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Profissionais</CardTitle>
              <CardDescription>
                Detalhes sobre sua empresa e posição
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                {isEditing ? (
                  <Select
                    value={selectedCompanyId}
                    onValueChange={handleCompanyChange}
                    disabled={companyDataLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input value={formData.empresa} disabled className="pl-10" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  {isEditing ? (
                    <Select
                      value={formData.departamento}
                      onValueChange={handleDepartmentChange}
                      disabled={!selectedCompanyId || companyDataLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.nome}>
                            {dept.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={formData.departamento} disabled />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade/Localização</Label>
                {isEditing ? (
                  <Select
                    value={formData.unidade}
                    onValueChange={handleLocationChange}
                    disabled={!selectedCompanyId || companyDataLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLocations.map((location) => (
                        <SelectItem key={location.id} value={location.nome}>
                          {location.nome} {location.cidade && `- ${location.cidade}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input value={formData.unidade} disabled className="pl-10" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    nome: profile?.nome || '',
                    empresa: profile?.empresa || '',
                    departamento: profile?.departamento || '',
                    cargo: profile?.cargo || '',
                    unidade: profile?.unidade || '',
                  });
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};