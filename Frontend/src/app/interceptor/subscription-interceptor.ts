import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, EMPTY, throwError } from 'rxjs';
import { AuthService } from '../service/auth-service';

/** Redirige vers la page d'abonnement si le backend renvoie 402 (non payé / expiré). */
export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/billing/') || req.url.includes('/api/chat/') || req.url.includes('/auth/')) {
    return next(req);
  }

  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 402) {
        const msg = String(err.error?.message ?? err.message ?? '').toLowerCase();
        const reqUrl = req.url.toLowerCase();
        const currentUrl = (router.url || '').toLowerCase();

        const cabinetByReq =
          reqUrl.includes('scope=cabinet') ||
          reqUrl.includes('/cabinet') ||
          reqUrl.includes('rdv-cabinet') ||
          reqUrl.includes('cabinet=') ||
          /\/api\/medecins\/[^/]+\/patients/.test(reqUrl);

        // Côté UI, on ne considère "cabinet" QUE si le paramètre scope=cabinet est présent.
        // (Évite les faux positifs: "cabinets-medecins", "abonnement cabinet requis..." dans le message, etc.)
        const cabinetByPage = currentUrl.includes('scope=cabinet');

        // On privilégie le contexte de la page courante (UI) plutôt que le message backend,
        // pour éviter de bloquer les modules "clinique" à cause d’un abonnement cabinet expiré.
        let scope: 'clinique' | 'cabinet' = cabinetByPage || cabinetByReq ? 'cabinet' : 'clinique';

        // Si l’utilisateur est médecin cabinet exclusif, il n’a pas de contexte clinique.
        if (auth.isMedecinCabinetExclusif()) {
          scope = 'cabinet';
        }

        if (cabinetByReq || auth.isMedecinCabinetExclusif()) {
          scope = 'cabinet';
        }

        if (scope === 'cabinet') {
          router.navigate(['/tarifs-abonnement'], {
            queryParams: { scope: 'cabinet', raison: 'paiement_requis' },
          });
        } else {
          router.navigate(['/mon-abonnement'], { queryParams: { scope } });
        }
        // On absorbe l'erreur pour éviter d'afficher le message backend dans les composants.
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
