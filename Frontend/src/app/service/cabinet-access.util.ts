import { Router } from '@angular/router';
import { AuthService } from './auth-service';

/** Redirige vers les forfaits cabinet si l'abonnement n'est pas actif. */
export function redirectSiAbonnementCabinetRequis(auth: AuthService, router: Router): boolean {
  if (!auth.doitPayerAbonnementCabinet()) {
    return false;
  }
  router.navigate(['/tarifs-abonnement'], {
    queryParams: { scope: 'cabinet', raison: 'paiement_requis' },
  });
  return true;
}

export const MSG_ABONNEMENT_CABINET_REQUIS =
  'Abonnement cabinet requis. Choisissez un forfait et payez pour accéder aux patients et rendez-vous cabinet.';
