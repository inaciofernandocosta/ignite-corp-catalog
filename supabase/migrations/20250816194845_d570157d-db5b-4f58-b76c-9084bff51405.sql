-- Fix critical RLS issues detected by security linter

-- Enable RLS on tables that don't have it enabled
-- Based on the schema, these tables need RLS enabled:

-- Enable RLS on nome_da_tabela (appears to be a test table)
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_action_tokens (already has policies but RLS might be disabled)
ALTER TABLE public.admin_action_tokens ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_admin (already has policies but RLS might be disabled)  
ALTER TABLE public.user_admin ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_roles (already has policies but RLS might be disabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on vagas_curso (already has policies but RLS might be disabled)
ALTER TABLE public.vagas_curso ENABLE ROW LEVEL SECURITY;

-- Enable RLS on certificados_conclusao (already has policies but RLS might be disabled) 
ALTER TABLE public.certificados_conclusao ENABLE ROW LEVEL SECURITY;

-- Enable RLS on course_banners (already has policies but RLS might be disabled)
ALTER TABLE public.course_banners ENABLE ROW LEVEL SECURITY;

-- Enable RLS on curso_modulos (already has policies but RLS might be disabled)
ALTER TABLE public.curso_modulos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cursos (already has policies but RLS might be disabled)
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on departamentos (already has policies but RLS might be disabled)
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on empresas (already has policies but RLS might be disabled)
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inscricoes_cursos (already has policies but RLS might be disabled)
ALTER TABLE public.inscricoes_cursos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on locais (already has policies but RLS might be disabled)
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

-- Enable RLS on modulo_aulas (already has policies but RLS might be disabled)
ALTER TABLE public.modulo_aulas ENABLE ROW LEVEL SECURITY;

-- Enable RLS on modulo_materiais (already has policies but RLS might be disabled)
ALTER TABLE public.modulo_materiais ENABLE ROW LEVEL SECURITY;

-- Enable RLS on progresso_aulas (already has policies but RLS might be disabled)
ALTER TABLE public.progresso_aulas ENABLE ROW LEVEL SECURITY;