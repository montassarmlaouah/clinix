import { hasMedecinClinique, isMedecinCabinet } from '@/src/utils/medecinContext';

/** Scope API billing : clinique et cabinet sont indépendants. */
export function resolveBillingScope(
  estCabinet: boolean,
  cliniqueId: string | number | null | undefined,
  explicit?: 'clinique' | 'cabinet',
  accesCabinet?: boolean,
): 'clinique' | 'cabinet' {
  if (explicit) return explicit;
  if (isMedecinCabinet(estCabinet, cliniqueId) && !hasMedecinClinique(cliniqueId)) return 'cabinet';
  if (hasMedecinClinique(cliniqueId) && !accesCabinet) return 'clinique';
  if (hasMedecinClinique(cliniqueId)) return 'clinique';
  return 'cabinet';
}

export function billingScopeQuery(scope: 'clinique' | 'cabinet'): string {
  return `?scope=${scope}`;
}
