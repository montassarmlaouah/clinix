import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchDashboardStats } from '@/src/api/dashboard.api';
import type { DashboardRole, DashboardStatsResponse } from '@/src/types/dashboard.types';

const REFETCH_INTERVAL_MS = 60_000;

interface UseDashboardStatsResult {
  data:      DashboardStatsResponse | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useDashboardStats(
  role:       DashboardRole,
  cliniqueId?: string | number | null,
  userId?:    string | number | null,
): UseDashboardStatsResult {
  const [data,    setData]    = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardStats(role, cliniqueId, userId);
      setData(result);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Erreur de chargement';
      setError(msg);
      if (__DEV__) console.error(`[useDashboardStats] role=${role}`, err);
    } finally {
      setLoading(false);
    }
  }, [role, cliniqueId, userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    intervalRef.current = setInterval(() => load(true), REFETCH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  return { data, loading, error, refetch: () => load() };
}
