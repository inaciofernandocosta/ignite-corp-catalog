-- Criar política INSERT anônima para inscricoes_cursos (matching inscricoes_mentoria)
CREATE POLICY "allow_anonymous_course_enrollment" ON public.inscricoes_cursos
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Também criar política SELECT para dados recém-inseridos (para .select funcionar)
CREATE POLICY "select_recent_enrollments" ON public.inscricoes_cursos
  FOR SELECT 
  TO anon, authenticated
  USING (data_inscricao >= NOW() - INTERVAL '5 minutes');