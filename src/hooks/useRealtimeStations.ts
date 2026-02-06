import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Station {
  id: string;
  nom: string;
  code: string;
  ville: string;
  region: string;
  adresse: string;
  type: string;
  statut: string;
  entreprise_id: string;
  latitude: number | null;
  longitude: number | null;
  stock_essence: number;
  stock_gasoil: number;
  stock_gpl: number;
  stock_lubrifiants: number;
  capacite_essence: number;
  capacite_gasoil: number;
  capacite_gpl: number;
  capacite_lubrifiants: number;
  gestionnaire_nom: string | null;
  gestionnaire_telephone: string | null;
  nombre_pompes: number;
}

export function useRealtimeStations(entrepriseId?: string) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      let query = supabase
        .from('stations')
        .select('*')
        .order('nom');

      if (entrepriseId) {
        query = query.eq('entreprise_id', entrepriseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStations(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId]);

  useEffect(() => {
    fetchStations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('stations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stations',
        },
        (payload: RealtimePostgresChangesPayload<Station>) => {
          if (payload.eventType === 'INSERT') {
            setStations(prev => [...prev, payload.new as Station]);
          } else if (payload.eventType === 'UPDATE') {
            setStations(prev =>
              prev.map(s => (s.id === (payload.new as Station).id ? payload.new as Station : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setStations(prev =>
              prev.filter(s => s.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStations]);

  return { stations, loading, error, refetch: fetchStations };
}
