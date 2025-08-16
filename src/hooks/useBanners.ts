import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Banner {
  id: string;
  message: string;
  icon: string;
  course_slug: string;
  text_color: string;
  background_color: string;
  border_color: string;
}

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('course_banners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setBanners(data || []);
      } catch (err) {
        console.error('Erro ao buscar banners:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar banners');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return { banners, loading, error };
};