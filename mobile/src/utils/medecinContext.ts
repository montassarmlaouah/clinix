/** Médecin sans clinique rattachée (cabinet / libéral). */
export function isMedecinCabinet(
  estCabinet: boolean,
  cliniqueId: string | number | null | undefined,
): boolean {
  if (estCabinet) return true;
  if (cliniqueId == null || cliniqueId === '' || cliniqueId === 'null' || cliniqueId === 'undefined') {
    return true;
  }
  return false;
}

export function hasMedecinClinique(cliniqueId: string | number | null | undefined): boolean {
  return cliniqueId != null && cliniqueId !== '' && cliniqueId !== 'null' && cliniqueId !== 'undefined';
}

/** Accès cabinet (patients / RDV cabinet) — cabinet pur ou médecin de clinique. */
export function medecinShowCabinetMenus(
  estCabinet: boolean,
  cliniqueId: string | number | null | undefined,
): boolean {
  return isMedecinCabinet(estCabinet, cliniqueId) || hasMedecinClinique(cliniqueId);
}
