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
    const role = this.getRole();
    if (!role) return false;
    const r = role.toUpperCase().replace(/-/g, '_');
    return r === 'ROLE_ADMIN_CLINIQUE' || r === 'ADMIN_CLINIQUE';
  }

  isPatient(): boolean {
    return this.hasRole('ROLE_PATIENT');
  }

  isMedecin(): boolean {
    const role = this.getRole();
    if (!role) return false;
    const r = role.toUpperCase().replace(/-/g, '_');
    return r === 'ROLE_MEDECIN' || r === 'MEDECIN';
  }

  /** Médecin sans clinique dans le JWT (cabinet indépendant / libéral). */
  isMedecinCabinetExclusif(): boolean {
    if (!this.isMedecin()) {
      return false;
    }
    const cid = this.getCliniqueId();
    return !cid || cid === 'null' || cid === 'undefined';
  }

  /** Médecin rattaché à une clinique (JWT avec cliniqueId). */
  hasMedecinClinique(): boolean {
    const cid = this.getCliniqueId();
    return !!cid && cid !== 'null' && cid !== 'undefined';
  }

  /**
   * Médecin pouvant gérer un cabinet (patients cabinet, abonnement cabinet).
   * Cabinet exclusif ou médecin de clinique avec activité cabinet.
   */
  isMedecinCabinet(): boolean {
    return this.isMedecin();
  }

  /** Abonnement / forfaits cabinet médical (tout médecin). */
  peutGererAbonnementCabinet(): boolean {
    return this.isMedecin();
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

  isPharmacien(): boolean {
    const role = this.getRole();
    return role === 'ROLE_PHARMACIEN' || role === 'PHARMACIEN';
  }

  /** Rôle JWT normalisé sans préfixe ROLE_ (ex. MEDECIN, ADMIN_CLINIQUE). */
  private normalizedRoleKey(): string {
    let r = (this.getRole() || '').toUpperCase().replace(/-/g, '_');
    if (r.startsWith('ROLE_')) {
      r = r.substring(5);
    }
    return r;
  }

  /**
   * Vérifie si l'utilisateur courant peut suivre le lien d'une notification (évite d'afficher des routes interdites).
   */
  peutAccederNotificationLien(url?: string | null): boolean {
    if (!url || !String(url).trim()) {
      return false;
    }
    const raw = String(url).split('?')[0].split('#')[0].trim();
    const p = raw.startsWith('/') ? raw.toLowerCase() : `/${raw.toLowerCase()}`;
    const r = this.normalizedRoleKey();
    const is = (...roles: string[]) => roles.includes(r);

    if (p === '/login' || p === '/profil' || p === '/dashboard' || p.startsWith('/notifications')) {
      return true;
    }

    const matchPrefix = (prefix: string, roles: string[]) => {
      const underPath = p.startsWith(`${prefix}/`);
      const kebabSibling = p.startsWith(`${prefix}-`);
      return p === prefix || underPath || kebabSibling ? is(...roles) : null;
    };

    const rules: { prefix: string; roles: string[] }[] = [
      { prefix: '/administrateurs', roles: ['SUPER_ADMIN'] },
      { prefix: '/clinique', roles: ['SUPER_ADMIN'] },
      { prefix: '/cabinets-medecins', roles: ['SUPER_ADMIN'] },
      { prefix: '/equipements', roles: ['ADMIN_CLINIQUE', 'TECHNICIEN_MAINTENANCE'] },
      { prefix: '/chambres', roles: ['ADMIN_CLINIQUE', 'SECRETAIRE', 'MEDECIN', 'INFIRMIER', 'TECHNICIEN_MAINTENANCE'] },
      { prefix: '/mon-dossier', roles: ['PATIENT'] },
      { prefix: '/patient', roles: ['PATIENT'] },
      { prefix: '/medecin-hospitalisations', roles: ['MEDECIN', 'INFIRMIER'] },
      { prefix: '/medecin', roles: ['MEDECIN'] },
      { prefix: '/infirmier', roles: ['INFIRMIER', 'CHEF_PERSONNEL'] },
      { prefix: '/radiologue', roles: ['RADIOLOGUE'] },
      { prefix: '/pharmacie', roles: ['PHARMACIEN', 'ADMIN_CLINIQUE'] },
      { prefix: '/pharmacien', roles: ['PHARMACIEN'] },
      { prefix: '/rendez-vous', roles: ['MEDECIN', 'SECRETAIRE', 'INFIRMIER', 'ADMIN_CLINIQUE', 'PATIENT'] },
      { prefix: '/patients', roles: ['MEDECIN', 'SECRETAIRE', 'INFIRMIER', 'ADMIN_CLINIQUE'] },
      { prefix: '/personnel', roles: ['ADMIN_CLINIQUE', 'SUPER_ADMIN'] },
      { prefix: '/services-medicaux', roles: ['ADMIN_CLINIQUE', 'SUPER_ADMIN'] },
      { prefix: '/mon-planning', roles: ['INFIRMIER'] },
      { prefix: '/congie', roles: ['INFIRMIER', 'CHEF_PERSONNEL'] },
      { prefix: '/facturation-patient', roles: ['ADMIN_CLINIQUE', 'SECRETAIRE'] },
      { prefix: '/mon-abonnement', roles: ['ADMIN_CLINIQUE', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'PHARMACIEN', 'RADIOLOGUE', 'TECHNICIEN_MAINTENANCE'] },
      { prefix: '/tarifs-abonnement', roles: ['ADMIN_CLINIQUE', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'PHARMACIEN', 'RADIOLOGUE'] },
      { prefix: '/demandes-operation', roles: ['MEDECIN', 'SECRETAIRE', 'INFIRMIER', 'ADMIN_CLINIQUE'] },
      { prefix: '/demandes-medicament', roles: ['MEDECIN', 'SECRETAIRE', 'INFIRMIER', 'ADMIN_CLINIQUE', 'PHARMACIEN'] },
      { prefix: '/conges-medecin', roles: ['MEDECIN', 'SECRETAIRE', 'ADMIN_CLINIQUE', 'CHEF_PERSONNEL'] },
      { prefix: '/presences', roles: ['CHEF_PERSONNEL', 'INFIRMIER'] },
      { prefix: '/planning-infirmiers', roles: ['CHEF_PERSONNEL', 'INFIRMIER'] },
    ];

    for (const { prefix, roles } of rules) {
      const hit = matchPrefix(prefix, roles);
      if (hit !== null) {
        return hit;
      }
    }

    return false;
  }

  // ============ FORGOT PASSWORD ============

  /**
   * Envoie un code de réinitialisation : soit par SMS ({ telephone }), soit par e-mail ({ email }).
   */
  sendForgotPasswordCode(payload: { telephone?: string; email?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password/send-code`, payload);
  }

  /**
   * Vérifie le code (même canal que l'envoi : telephone ou email).
   */
  verifyForgotPasswordCode(payload: { telephone?: string; email?: string; code: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password/verify-code`, payload);
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
   * Réinitialise le mot de passe après vérification du code (telephone ou email selon le flux).
   */
  resetForgotPassword(payload: {
    telephone?: string;
    email?: string;
    newPassword: string;
    resetToken: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/forgot-password/reset`, payload);
  }

  /**
   * Récupère le profil complet de l'utilisateur connecté depuis la base de données
   */
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }

  /**
   * Met à jour le profil (nom, prénom, e-mail, téléphone, CIN). JWT requis.
   * Si le téléphone change, la réponse peut contenir reconnectRequired: true.
   */
  updateProfile(payload: {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    cin?: string;
  }): Observable<{
    message?: string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    cin?: string;
    reconnectRequired?: boolean;
    info?: string;
    error?: string;
  }> {
    return this.http.put<{
      message?: string;
      nom?: string;
      prenom?: string;
      email?: string;
      telephone?: string;
      cin?: string;
      reconnectRequired?: boolean;
      info?: string;
      error?: string;
    }>(`${this.baseUrl}/profile`, payload);
  }
}
