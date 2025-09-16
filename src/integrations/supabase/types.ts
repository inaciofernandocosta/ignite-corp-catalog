export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_action_tokens: {
        Row: {
          action_type: string
          created_at: string
          expires_at: string
          id: string
          inscricao_id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          expires_at?: string
          id?: string
          inscricao_id: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          inscricao_id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_action_tokens_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "inscricoes_mentoria"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos_departamento: {
        Row: {
          ativo: boolean
          cargo_nome: string
          created_at: string
          departamento_id: string
          empresa_id: string
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo_nome: string
          created_at?: string
          departamento_id: string
          empresa_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo_nome?: string
          created_at?: string
          departamento_id?: string
          empresa_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificados_conclusao: {
        Row: {
          aprovado_por: string | null
          certificado_pdf: string | null
          created_at: string
          data_conclusao: string
          data_emissao: string
          id: string
          inscricao_curso_id: string
          numero_certificado: string
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          certificado_pdf?: string | null
          created_at?: string
          data_conclusao: string
          data_emissao?: string
          id?: string
          inscricao_curso_id: string
          numero_certificado: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          certificado_pdf?: string | null
          created_at?: string
          data_conclusao?: string
          data_emissao?: string
          id?: string
          inscricao_curso_id?: string
          numero_certificado?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_conclusao_inscricao_curso_id_fkey"
            columns: ["inscricao_curso_id"]
            isOneToOne: false
            referencedRelation: "inscricoes_cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      course_banners: {
        Row: {
          background_color: string
          border_color: string
          course_slug: string
          created_at: string | null
          data_imersao: string | null
          icon: string | null
          id: string
          is_active: boolean
          message: string
          text_color: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string
          border_color?: string
          course_slug: string
          created_at?: string | null
          data_imersao?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          message: string
          text_color?: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string
          border_color?: string
          course_slug?: string
          created_at?: string | null
          data_imersao?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          message?: string
          text_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      curso_modulos: {
        Row: {
          created_at: string
          curso_id: string
          descricao: string | null
          duracao_estimada: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          descricao?: string | null
          duracao_estimada?: string | null
          id?: string
          ordem: number
          titulo: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          descricao?: string | null
          duracao_estimada?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          certificacao: boolean | null
          certificado_template: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string
          duracao: string
          id: string
          imagem_capa: string | null
          limite_alunos: number | null
          limite_por_departamento: number | null
          local_id: string | null
          nivel: string
          objetivos: string[] | null
          pre_requisitos: string[] | null
          preco: number | null
          slug: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          certificacao?: boolean | null
          certificado_template?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao: string
          duracao: string
          id?: string
          imagem_capa?: string | null
          limite_alunos?: number | null
          limite_por_departamento?: number | null
          local_id?: string | null
          nivel: string
          objetivos?: string[] | null
          pre_requisitos?: string[] | null
          preco?: number | null
          slug?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          certificacao?: boolean | null
          certificado_template?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string
          duracao?: string
          id?: string
          imagem_capa?: string | null
          limite_alunos?: number | null
          limite_por_departamento?: number | null
          local_id?: string | null
          nivel?: string
          objetivos?: string[] | null
          pre_requisitos?: string[] | null
          preco?: number | null
          slug?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inscricoes_cursos: {
        Row: {
          aluno_id: string
          curso_id: string
          data_inscricao: string
          id: string
          progresso: number | null
          status: string | null
          ultima_atividade: string | null
        }
        Insert: {
          aluno_id: string
          curso_id: string
          data_inscricao?: string
          id?: string
          progresso?: number | null
          status?: string | null
          ultima_atividade?: string | null
        }
        Update: {
          aluno_id?: string
          curso_id?: string
          data_inscricao?: string
          id?: string
          progresso?: number | null
          status?: string | null
          ultima_atividade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_cursos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "inscricoes_mentoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes_mentoria: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string | null
          curso_nome: string
          data_aprovacao: string | null
          departamento: string | null
          email: string
          empresa: string | null
          id: string
          nome: string
          origem: string | null
          senha_hash: string | null
          status: string | null
          telefone: string | null
          token_validacao: string | null
          unidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          curso_nome?: string
          data_aprovacao?: string | null
          departamento?: string | null
          email: string
          empresa?: string | null
          id?: string
          nome: string
          origem?: string | null
          senha_hash?: string | null
          status?: string | null
          telefone?: string | null
          token_validacao?: string | null
          unidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string | null
          curso_nome?: string
          data_aprovacao?: string | null
          departamento?: string | null
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          origem?: string | null
          senha_hash?: string | null
          status?: string | null
          telefone?: string | null
          token_validacao?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      locais: {
        Row: {
          cidade: string | null
          created_at: string
          empresa_id: string
          estado: string | null
          id: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          empresa_id: string
          estado?: string | null
          id?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          empresa_id?: string
          estado?: string | null
          id?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      modulo_aulas: {
        Row: {
          conteudo_url: string | null
          created_at: string
          descricao: string | null
          duracao: string | null
          id: string
          modulo_id: string
          ordem: number
          tipo: string | null
          titulo: string
        }
        Insert: {
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          duracao?: string | null
          id?: string
          modulo_id: string
          ordem: number
          tipo?: string | null
          titulo: string
        }
        Update: {
          conteudo_url?: string | null
          created_at?: string
          descricao?: string | null
          duracao?: string | null
          id?: string
          modulo_id?: string
          ordem?: number
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulo_aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "curso_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulo_materiais: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          ativo: boolean
          created_at: string
          descricao: string | null
          formato: string | null
          id: string
          modulo_id: string
          ordem: number
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          formato?: string | null
          id?: string
          modulo_id: string
          ordem?: number
          tipo?: string
          titulo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          formato?: string | null
          id?: string
          modulo_id?: string
          ordem?: number
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modulo_materiais_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "curso_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used: boolean
          used_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      progresso_aulas: {
        Row: {
          aula_id: string
          concluida: boolean | null
          data_conclusao: string | null
          id: string
          inscricao_curso_id: string
          tempo_assistido: number | null
        }
        Insert: {
          aula_id: string
          concluida?: boolean | null
          data_conclusao?: string | null
          id?: string
          inscricao_curso_id: string
          tempo_assistido?: number | null
        }
        Update: {
          aula_id?: string
          concluida?: boolean | null
          data_conclusao?: string | null
          id?: string
          inscricao_curso_id?: string
          tempo_assistido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "modulo_aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aulas_inscricao_curso_id_fkey"
            columns: ["inscricao_curso_id"]
            isOneToOne: false
            referencedRelation: "inscricoes_cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_admin: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string | null
          primeiro_acesso: boolean
          senha_hash: string | null
          token_ativacao: string | null
          token_expira_em: string | null
          token_recuperacao: string | null
          ultimo_login: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          primeiro_acesso?: boolean
          senha_hash?: string | null
          token_ativacao?: string | null
          token_expira_em?: string | null
          token_recuperacao?: string | null
          ultimo_login?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          primeiro_acesso?: boolean
          senha_hash?: string | null
          token_ativacao?: string | null
          token_expira_em?: string | null
          token_recuperacao?: string | null
          ultimo_login?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          active: boolean
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "inscricoes_mentoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "inscricoes_mentoria"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_curso: {
        Row: {
          created_at: string
          curso_nome: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string
          status: string
          turma: string
          updated_at: string
          vagas_ocupadas: number
          vagas_totais: number
        }
        Insert: {
          created_at?: string
          curso_nome: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string
          status?: string
          turma?: string
          updated_at?: string
          vagas_ocupadas?: number
          vagas_totais: number
        }
        Update: {
          created_at?: string
          curso_nome?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string
          status?: string
          turma?: string
          updated_at?: string
          vagas_ocupadas?: number
          vagas_totais?: number
        }
        Relationships: []
      }
    }
    Views: {
      users_eligible_for_reset: {
        Row: {
          can_reset_password: boolean | null
          email: string | null
          email_confirmed_at: string | null
          inscricao_ativa: boolean | null
          inscricao_status: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_status: {
        Args: { new_status: string; target_user_id: string }
        Returns: Json
      }
      backfill_auth_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          nome: string
          resultado: string
        }[]
      }
      backfill_missing_auth_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          nome: string
          resultado: string
        }[]
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      call_edge_function_secure: {
        Args: { function_name: string; payload?: Json }
        Returns: undefined
      }
      check_password_reset_eligibility: {
        Args: { user_email: string }
        Returns: {
          eligible: boolean
          reason: string
          user_data: Json
        }[]
      }
      check_user_role: {
        Args: { required_role: string; user_email: string }
        Returns: boolean
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_first_admin: {
        Args: { admin_email: string }
        Returns: Json
      }
      criar_conta_auth_admin: {
        Args: { user_email: string; user_password?: string }
        Returns: string
      }
      criar_conta_auth_para_inscrito: {
        Args: { user_email: string }
        Returns: string
      }
      criar_conta_auth_segura: {
        Args: { user_email: string; user_password?: string }
        Returns: string
      }
      criar_token_ativacao_admin: {
        Args: { admin_email: string }
        Returns: string
      }
      criar_token_recuperacao_admin: {
        Args: { admin_email: string }
        Returns: string
      }
      delete_user_completely: {
        Args: { user_email: string }
        Returns: string
      }
      email_exists_for_recovery: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      email_exists_for_recovery_backup: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      email_exists_for_recovery_v2: {
        Args: { email_param: string }
        Returns: boolean
      }
      generate_signed_url: {
        Args: { bucket_name: string; expires_in?: number; object_path: string }
        Returns: string
      }
      generate_slug: {
        Args: { title: string }
        Returns: string
      }
      gerar_numero_certificado: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gerar_token_admin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gerar_token_unico: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_by_email: {
        Args: { user_email: string }
        Returns: {
          ativo: boolean
          email: string
          id: string
          senha_hash: string
          status: string
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin_by_email: {
        Args: { check_email: string }
        Returns: boolean
      }
      is_admin_check: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_simple: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      limpar_tokens_expirados: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      password_reset_check: {
        Args: { user_email: string }
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { promoted_by_email: string; user_email: string }
        Returns: Json
      }
      registrar_log_inscricao: {
        Args: {
          p_acao: string
          p_detalhes?: Json
          p_inscricao_id: number
          p_ip_origem?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validar_email: {
        Args: { email_input: string }
        Returns: boolean
      }
      validar_token_admin: {
        Args: { nova_senha_hash: string; token_input: string }
        Returns: Json
      }
      verificar_limites_curso: {
        Args: { p_curso_id: string }
        Returns: Json
      }
      verificar_vagas_disponiveis: {
        Args: { p_curso_nome: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
