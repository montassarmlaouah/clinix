import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, AppRole, ROLES_PERSONNEL, VerificationCodeRequest } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/auth';
  private smsUrl = 'http://localhost:8080/api/sms';

  constructor(private http: HttpClient, private router: Router) { }

  verifierTelephone(telephone: string): Observable<{
    telephone: string,
    existe: boolean,
    compteEnAttente: boolean,
    peutInscrire: boolean,
    message: string,
    role?: string,
    actif?: boolean
  }> {
    return this.http.get<{
      telephone: string,
      existe: boolean,
      compteEnAttente: boolean,
      peutInscrire: boolean,
      message: string,
      role?: string,
      actif?: boolean
    }>(`${this.baseUrl}/verifier-telephone/${telephone}`);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Supprimer l'ancien token avant de se connecter
    localStorage.removeItem('token');
    localStorage.removeItem('cliniqueId');

    return this.http.post<AuthResponse>(this.baseUrl + "/login", credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.storeLoginTimestamps();

            // Extraire et stocker le cliniqueId du token
            try {
              const parts = response.token.split('.');
              if (parts.length >= 3) {
                const payload = JSON.parse(atob(parts[1]));
                if (payload.cliniqueId) {
                  localStorage.setItem('cliniqueId', payload.cliniqueId);
                } else {
                  console.warn('Aucun cliniqueId dans le token JWT');
                }
              }
            } catch (e) {
              console.error('Erreur lors de l\'extraction du cliniqueId:', e);
            }
          }
        })
      );
  }

  private storeLoginTimestamps(): void {
    const nowIso = new Date().toISOString();
    const lastLoginAt = localStorage.getItem('lastLoginAt');
    if (lastLoginAt) {
      localStorage.setItem('previousLoginAt', lastLoginAt);
    }
    localStorage.setItem('lastLoginAt', nowIso);
  }

  getLastLoginAt(): Date | null {
    const value = localStorage.getItem('lastLoginAt');
    return value ? new Date(value) : null;
  }

  getPreviousLoginAt(): Date | null {
    const value = localStorage.getItem('previousLoginAt');
    return value ? new Date(value) : null;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (token && this.isTokenExpired(token)) {
      localStorage.removeItem('token');
      return null;
    }
    return token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return true;
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      if (!exp) return false;
      // exp est en secondes, Date.now() en millisecondes
      return Date.now() >= exp * 1000;
    } catch (e) {
      return true;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }



  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      console.log('DEBUG AuthService - Full JWT Payload:', payload);
      console.log('DEBUG AuthService - Role from token:', payload.role);
      return payload.role || null;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || payload.username || null;
    } catch (e) {
      console.error('Error parsing username from token:', e);
      return null;
    }
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.id || payload.userId || payload.sub || null;
    } catch (e) {
      console.error('Error parsing userId from token:', e);
      return null;
    }
  }

  // Renvoie le téléphone de l'utilisateur connecté
  getTelephone(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.telephone || payload.sub || null;
    } catch (e) {
      console.error('Error parsing telephone from token:', e);
      return null;
    }
  }

  getCliniqueId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.cliniqueId || null;
    } catch (e) {
      console.error('Error parsing cliniqueId from token:', e);
      return null;
    }
  }

  getNom(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.nom || null;
    } catch (e) {
      console.error('Error parsing nom from token:', e);
      return null;
    }
  }

  getPrenom(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.prenom || null;
    } catch (e) {
      console.error('Error parsing prenom from token:', e);
      return null;
    }
  }

  getEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.email || null;
    } catch (e) {
      console.error('Error parsing email from token:', e);
      return null;
    }
  }

  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  isSuperAdmin(): boolean {
    const role = this.getRole();
    if (!role) return false;
    const r = role.toUpperCase().replace(/-/g, '_');
    return r === 'ROLE_SUPER_ADMIN' || r === 'SUPER_ADMIN';
  }

  isAdminClinique(): boolean {
    return this.hasRole('ROLE_ADMIN_CLINIQUE');
  }

  isPatient(): boolean {
    return this.hasRole('ROLE_PATIENT');
  }

  isMedecin(): boolean {
    return this.hasRole('ROLE_MEDECIN');
  }

  /** Médecin de cabinet (pas de clinique rattachée dans le JWT) — ex. pratique libérale. */
  isMedecinCabinet(): boolean {
    if (!this.isMedecin()) {
      return false;
    }
    const cid = this.getCliniqueId();
    if (!cid || cid === 'null' || cid === 'undefined') {
      return true;
    }
    return false;
  }

  isInfirmier(): boolean {
    return this.hasRole('ROLE_INFIRMIER');
  }

  isRadiologue(): boolean {
    return this.hasRole('ROLE_RADIOLOGUE');
  }

  isPersonnel(): boolean {
    const role = this.getRole();
    return role ? ROLES_PERSONNEL.includes(role as AppRole) : false;
  }

  isChefPersonnel(): boolean {
    const role = this.getRole();
    return role === 'ROLE_CHEF_PERSONNEL' || role === 'CHEF_PERSONNEL';
  }

  isSecretaire(): boolean {
    const role = this.getRole();
    return role === 'ROLE_SECRETAIRE' || role === 'SECRETAIRE';
  }

  isTechnicienMaintenance(): boolean {
    const role = this.getRole();
    return role === 'ROLE_TECHNICIEN_MAINTENANCE' || role === 'TECHNICIEN_MAINTENANCE';
  }

  // ============ FORGOT PASSWORD ============

  /**
   * Envoie un code de vérification par SMS au numéro de téléphone
   */
  sendVerificationCode(telephone: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password/send-code`, { telephone });
  }

  /**
   * Vérifie le code de vérification
   */
  verifyCode(telephone: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password/verify-code`, { telephone, code });
  }

  /**
   * Envoie un code OTP pour l'inscription (SMS)
   */
  sendRegisterOtp(telephone: string): Observable<{ success: string; message: string; code?: string }> {
    return this.http.post<{ success: string; message: string; code?: string }>(`${this.smsUrl}/send-otp`, { telephone });
  }

  /**
   * Vérifie le code OTP pour l'inscription (SMS)
   */
  verifyRegisterOtp(payload: VerificationCodeRequest): Observable<{ success: string; message: string }> {
    return this.http.post<{ success: string; message: string }>(`${this.smsUrl}/verify-otp`, payload);
  }

  /**
   * Réinitialise le mot de passe
   */
  resetPassword(telephone: string, newPassword: string, resetToken: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password/reset`, {
      telephone,
      newPassword,
      resetToken
    });
  }

  /**
   * Récupère le profil complet de l'utilisateur connecté depuis la base de données
   */
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }
}
