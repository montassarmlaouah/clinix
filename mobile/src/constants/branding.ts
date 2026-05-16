/** Logo CLINIX (icône carrée — logo2 uniquement) */
export const CLINIX_LOGO = require('@/src/images/logo2.jpeg') as number;
export const CLINIX_LOGO_ICON = CLINIX_LOGO;
export const CLINIX_LOGO_WORDMARK = CLINIX_LOGO;

export const APP_NAME = 'CLINIX';
export const APP_TAGLINE = 'Votre santé, notre priorité';

/** Route profil par rôle */
export function getProfilRoute(role: string | null | undefined): string {
  const map: Record<string, string> = {
    ROLE_SUPER_ADMIN: '/(superadmin)/profil',
    ROLE_ADMIN_CLINIQUE: '/(admin)/profil',
    ROLE_SECRETAIRE: '/(secretaire)/profil',
    ROLE_MEDECIN: '/(medecin)/profil',
    ROLE_INFIRMIER: '/(infirmier)/profil',
    ROLE_RADIOLOGUE: '/(radiologue)/profil',
    ROLE_PHARMACIEN: '/(pharmacien)/profil',
    ROLE_PATIENT: '/(patient)/profil',
    ROLE_CHEF_PERSONNEL: '/(chef-personnel)/profil',
    ROLE_TECHNICIEN_MAINTENANCE: '/(technicien)/profil',
  };
  if (!role) return '/(auth)/login';
  if (map[role]) return map[role];
  const withPrefix = `ROLE_${role}`;
  return map[withPrefix] ?? '/(auth)/login';
}
