import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Company {
  id: string;
  nome: string;
}

export interface Department {
  id: string;
  empresa_id: string;
  nome: string;
}

export interface Location {
  id: string;
  empresa_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
}

export const useCompanyData = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar empresas
        const { data: companiesData, error: companiesError } = await supabase
          .from('empresas')
          .select('id, nome')
          .eq('status', 'ativo')
          .order('nome');

        if (companiesError) throw companiesError;

        // Buscar departamentos
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departamentos')
          .select('id, empresa_id, nome')
          .eq('status', 'ativo')
          .order('nome');

        if (departmentsError) throw departmentsError;

        // Buscar locais
        const { data: locationsData, error: locationsError } = await supabase
          .from('locais')
          .select('id, empresa_id, nome, cidade, estado')
          .eq('status', 'ativo')
          .order('nome');

        if (locationsError) throw locationsError;

        setCompanies(companiesData || []);
        setDepartments(departmentsData || []);
        setLocations(locationsData || []);
      } catch (error) {
        console.error('Erro ao buscar dados da empresa:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDepartmentsByCompany = (companyId: string) => {
    return departments.filter(dept => dept.empresa_id === companyId);
  };

  const getLocationsByCompany = (companyId: string) => {
    return locations.filter(loc => loc.empresa_id === companyId);
  };

  return {
    companies,
    departments,
    locations,
    loading,
    getDepartmentsByCompany,
    getLocationsByCompany,
  };
};