import { HttpInterceptorFn } from '@angular/common/http';

/** Indique au backend (filtre abonnement) qu'une requête concerne le cabinet médical. */
export const billingScopeInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url.toLowerCase();
  const isCabinetApi =
    url.includes('scope=cabinet') ||
    url.includes('rdv-cabinet') ||
    /\/api\/medecins\/[^/]+\/patients/.test(url);

  if (!isCabinetApi) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'X-Billing-Scope': 'cabinet' },
    }),
  );
};
