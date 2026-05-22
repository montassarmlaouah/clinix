import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { billingScopeQuery, resolveBillingScope } from '@/src/utils/billingScope';

export interface SubscriptionStatus {
  statut?: string;
  offreNom?: string;
  dateDebut?: string;
  datePremierPaiement?: string;
  dateFin?: string;
  offreCategorie?: string;
  accesAutorise?: boolean;
}

export function useSubscriptionStatus(
  pollIntervalMs = 5 * 60 * 1000,
  explicitScope?: 'clinique' | 'cabinet',
) {
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<SubscriptionStatus>(
        `${BILLING.ABONNEMENT_COURANT}${billingScopeQuery(scope)}`,
      );
      setStatus(data ?? null);
      setError(null);
    } catch (err: any) {
      if (err?.status === 402) {
        setStatus(null);
        setError('Abonnement requis');
      } else {
        setError(err?.message ?? 'Erreur');
      }
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, pollIntervalMs);
    return () => clearInterval(id);
  }, [fetchStatus, pollIntervalMs]);

  return { status, loading, error, refetch: fetchStatus };
}
