import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();
    if (!token) {
      console.warn('AuthGuard: No token found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    console.log('AuthGuard: Token valid, access granted');
    return true;
  }
}
