import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Loader2, Save, X } from "lucide-react";

interface Student {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  departamento?: string;
  cargo?: string;
  unidade?: string;
  status: string;
  ativo: boolean;
}

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onUserUpdated: () => void;
}

export function EditUserDialog({ isOpen, onOpenChange, student, onUserUpdated }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    departamento: "",
    cargo: "",
    unidade: "",
    status: "",
    ativo: true
  });
  const { toast } = useToast();

  // Carregar dados do usuário quando o dialog abrir
  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        nome: student.nome || "",
        email: student.email || "",
        telefone: student.telefone || "",
        empresa: student.empresa || "",
        departamento: student.departamento || "",
        cargo: student.cargo || "",
        unidade: student.unidade || "",
        status: student.status || "pendente",
        ativo: student.ativo
      });
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student) return;

    // Validações básicas
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome e e-mail são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe um e-mail válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se o e-mail já existe (se foi alterado)
      if (formData.email !== student.email) {
        const { data: existingUser } = await supabase
          .from('inscricoes_mentoria')
          .select('id')
          .eq('email', formData.email)
          .neq('id', student.id)
          .single();

        if (existingUser) {
          toast({
            title: "Erro",
            description: "Já existe um usuário cadastrado com este e-mail.",
            variant: "destructive"
          });
          return;
        }
      }

      const { error } = await supabase
        .from('inscricoes_mentoria')
        .update({
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
          telefone: formData.telefone.trim() || null,
          empresa: formData.empresa.trim() || null,
          departamento: formData.departamento.trim() || null,
          cargo: formData.cargo.trim() || null,
          unidade: formData.unidade.trim() || null,
          status: formData.status,
          ativo: formData.ativo
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Usuário atualizado!",
        description: `Os dados de ${formData.nome} foram atualizados com sucesso.`,
      });

      onUserUpdated();
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                placeholder="Nome da empresa"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                placeholder="Departamento"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Cargo/Função"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                placeholder="Unidade/Local"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                disabled={loading}
                className="rounded"
              />
              Usuário ativo
            </Label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}