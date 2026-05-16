import { useEffect } from 'react';

import { apiGet } from '@/src/api/client';
import { AUTH_ENDPOINTS, CLINIQUES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';

/** Charge et met en cache le nom de la clinique (remplace l’affichage par ID). */
export function useCliniqueNom(): string | null {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const cliniqueNom = useAuthStore((s) => s.cliniqueNom);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (cliniqueNom || cliniqueId == null) return;

    void (async () => {
      try {
        const profile = await apiGet<{ cliniqueNom?: string }>(AUTH_ENDPOINTS.PROFILE);
        if (profile?.cliniqueNom) {
          setAuth({ cliniqueNom: profile.cliniqueNom });
          return;
        }
      } catch {
        /* profil indisponible */
      }

      try {
        const clinique = await apiGet<{ nom?: string }>(CLINIQUES.BY_ID(cliniqueId));
        if (clinique?.nom) {
          setAuth({ cliniqueNom: clinique.nom });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [cliniqueId, cliniqueNom, setAuth]);

  return cliniqueNom;
}
