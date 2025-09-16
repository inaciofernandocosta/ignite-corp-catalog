import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Cargo {
  id: string;
  cargo_nome: string;
  empresa_id: string;
  departamento_id: string;
}

export const useCargoData = () => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCargosByDepartment = async (empresa_id: string, departamento_id: string) => {
    if (!empresa_id || !departamento_id) {
      setCargos([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cargos_departamento')
        .select('id, cargo_nome, empresa_id, departamento_id')
        .eq('empresa_id', empresa_id)
        .eq('departamento_id', departamento_id)
        .eq('ativo', true)
        .order('cargo_nome');

      if (error) throw error;
      
      setCargos(data || []);
    } catch (error) {
      console.error('Erro ao buscar cargos:', error);
      setCargos([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    cargos,
    loading,
    fetchCargosByDepartment,
  };
};