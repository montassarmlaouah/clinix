import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/auth-service';

/** Redirige vers la page d'abonnement si le backend renvoie 402 (non payé / expiré). */
export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/billing/') || req.url.includes('/auth/')) {
    return next(req);
  }

  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 402) {
        const msg = String(err.error?.message ?? err.message ?? '').toLowerCase();
        const url = req.url.toLowerCase();
        const cabinetMsg = msg.includes('cabinet');
        const cabinetUrl = url.includes('cabinet') || url.includes('rdv-cabinet') || url.includes('scope=cabinet');
        let scope: 'clinique' | 'cabinet' = 'clinique';
        if (auth.isMedecinCabinetExclusif() || cabinetMsg || cabinetUrl) {
          scope = 'cabinet';
        } else if (auth.medecinCliniqueEtCabinet() && cabinetUrl) {
          scope = 'cabinet';
        }
        router.navigate(['/mon-abonnement'], { queryParams: { scope } });
      }
      return throwError(() => err);
    }),
  );
};
