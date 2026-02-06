import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface Alerte {
  id: string;
  station_id: string | null;
  entreprise_id: string | null;
  type: string;
  niveau: string;
  message: string;
  resolu: boolean;
  resolu_at: string | null;
  resolu_par: string | null;
  created_at: string;
}

interface UseRealtimeAlertesOptions {
  entrepriseId?: string;
  stationId?: string;
  onlyUnresolved?: boolean;
  showToast?: boolean;
}

export function useRealtimeAlertes(options: UseRealtimeAlertesOptions = {}) {
  const { entrepriseId, stationId, onlyUnresolved = true, showToast = true } = options;
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchAlertes = useCallback(async () => {
    try {
      let query = supabase
        .from('alertes')
        .select('*')
        .order('created_at', { ascending: false });

      if (entrepriseId) {
        query = query.eq('entreprise_id', entrepriseId);
      }
      if (stationId) {
        query = query.eq('station_id', stationId);
      }
      if (onlyUnresolved) {
        query = query.eq('resolu', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlertes(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, stationId, onlyUnresolved]);

  useEffect(() => {
    fetchAlertes();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('alertes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertes',
        },
        (payload: RealtimePostgresChangesPayload<Alerte>) => {
          if (payload.eventType === 'INSERT') {
            const newAlerte = payload.new as Alerte;
            
            // Check if this alert matches our filters
            if (entrepriseId && newAlerte.entreprise_id !== entrepriseId) return;
            if (stationId && newAlerte.station_id !== stationId) return;
            if (onlyUnresolved && newAlerte.resolu) return;

            setAlertes(prev => [newAlerte, ...prev]);

            // Show toast notification for new alerts
            if (showToast) {
              toast({
                variant: newAlerte.niveau === 'critique' ? 'destructive' : 'default',
                title: newAlerte.niveau === 'critique' ? '🚨 Alerte Critique' : '⚠️ Nouvelle Alerte',
                description: newAlerte.message,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlerte = payload.new as Alerte;
            
            if (onlyUnresolved && updatedAlerte.resolu) {
              // Remove from list if resolved
              setAlertes(prev => prev.filter(a => a.id !== updatedAlerte.id));
            } else {
              setAlertes(prev =>
                prev.map(a => (a.id === updatedAlerte.id ? updatedAlerte : a))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setAlertes(prev =>
              prev.filter(a => a.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlertes, entrepriseId, stationId, onlyUnresolved, showToast, toast]);

  const resolveAlerte = async (alerteId: string) => {
    const { error } = await supabase
      .from('alertes')
      .update({ resolu: true, resolu_at: new Date().toISOString() })
      .eq('id', alerteId);

    if (error) throw error;
    await fetchAlertes();
  };

  return { 
    alertes, 
    loading, 
    error, 
    refetch: fetchAlertes,
    resolveAlerte,
    criticalCount: alertes.filter(a => a.niveau === 'critique').length,
    warningCount: alertes.filter(a => a.niveau === 'warning').length,
  };
}
