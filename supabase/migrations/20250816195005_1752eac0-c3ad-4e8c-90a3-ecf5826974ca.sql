-- Enable RLS on inscricoes_mentoria table (the main security fix)
-- This appears to not have been enabled despite having policies
ALTER TABLE public.inscricoes_mentoria ENABLE ROW LEVEL SECURITY;