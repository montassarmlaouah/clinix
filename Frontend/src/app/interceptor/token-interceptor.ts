import { inject } from '@angular/core';
import { AuthService } from '../service/auth-service';
import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Ne pas ajouter le token pour les endpoints d'authentification
  if (req.url.includes('/auth/login')) {
    console.log('🔓 Requête auth sans token:', req.url);
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.getToken();

  console.log('🔐 Token interceptor - URL:', req.url);
  console.log('🔐 Token présent:', token ? 'Oui (' + token.substring(0, 20) + '...)' : 'Non');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Token ajouté à la requête');
  } else {
    console.warn('⚠️ Aucun token disponible pour:', req.url);
  }

  return next(req);
};
