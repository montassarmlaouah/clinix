import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) { }

  private normalizeRole(role: string): string {
    const r = (role || '').trim();
    if (!r) return r;
    const withPrefix = r.startsWith('ROLE_') ? r : `ROLE_${r}`;
    return withPrefix.toUpperCase().replace(/-/g, '_');
  }

  /** Retourne true si le rôle est une variante de Super Admin */
  private isSuperAdminRole(role: string | null): boolean {
    if (!role) return false;
    const upper = role.toUpperCase().replace(/-/g, '_');
    return upper === 'ROLE_SUPER_ADMIN' || upper === 'SUPER_ADMIN';
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['role'] as string[];
    const userRole = this.auth.getRole();
    const token = this.auth.getToken();

    console.log('=== RoleGuard Debug ===');
    console.log('Allowed roles:', allowedRoles);
    console.log('User role:', userRole);
    console.log('Is logged in:', !!token);

    if (!token) {
      console.warn('RoleGuard: No token found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    const normalizedUserRole = userRole ? this.normalizeRole(userRole) : null;
    const normalizedAllowedRoles = (allowedRoles || []).map(r => this.normalizeRole(r));

    const allowed =
      normalizedUserRole &&
      (normalizedAllowedRoles.includes(normalizedUserRole) || (this.isSuperAdminRole(userRole) && normalizedAllowedRoles.includes('ROLE_SUPER_ADMIN')));

    if (!allowed) {
      console.warn('RoleGuard: User role not allowed, redirecting to home');
      this.router.navigate(['/dashboard']);
      return false;
    }

    console.log('RoleGuard: Access granted');
    return true;
  }
}
