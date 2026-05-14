import { OffreAbonnement } from '../model/abonnement.model';

export function prixPourCarte(o: OffreAbonnement, interval: 'MONTHLY' | 'YEARLY'): number {
  return interval === 'YEARLY' ? o.prixAnnuel ?? (o.prixMensuel ?? 0) * 12 : o.prixMensuel ?? 0;
}

export function economieAnnuelleCalc(o: OffreAbonnement): number {
  if (o.economieAnnuelleEstimee != null && o.economieAnnuelleEstimee >= 0) {
    return o.economieAnnuelleEstimee;
  }
  const m = o.prixMensuel ?? 0;
  const y = o.prixAnnuel ?? 0;
  return Math.max(Math.round(m * 12 - y), 0);
}
