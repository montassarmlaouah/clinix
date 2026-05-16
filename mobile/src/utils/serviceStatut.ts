/** Aligné API / web : le champ est `actif` (boolean), pas `statut`. */
export interface ServiceActifFields {
  actif?: boolean | null;
  statut?: 'ACTIF' | 'INACTIF' | string;
}

export function isServiceActif(service: ServiceActifFields): boolean {
  if (typeof service.actif === 'boolean') return service.actif;
  if (service.statut === 'ACTIF') return true;
  if (service.statut === 'INACTIF') return false;
  return true;
}

export function serviceMatchesStatutFilter(
  service: ServiceActifFields,
  filter: 'TOUS' | 'ACTIF' | 'INACTIF',
): boolean {
  if (filter === 'TOUS') return true;
  const actif = isServiceActif(service);
  return filter === 'ACTIF' ? actif : !actif;
}
