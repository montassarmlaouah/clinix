import { LUNA_COLORS } from '@/src/theme/colors';

// ── Enum ──────────────────────────────────────────────────────────────────────
export enum Roles {
  SUPER_ADMIN            = 'ROLE_SUPER_ADMIN',
  ADMIN_CLINIQUE         = 'ROLE_ADMIN_CLINIQUE',
  SECRETAIRE             = 'ROLE_SECRETAIRE',
  MEDECIN                = 'ROLE_MEDECIN',
  INFIRMIER              = 'ROLE_INFIRMIER',
  RADIOLOGUE             = 'ROLE_RADIOLOGUE',
  PHARMACIEN             = 'ROLE_PHARMACIEN',
  PATIENT                = 'ROLE_PATIENT',
  CHEF_PERSONNEL         = 'ROLE_CHEF_PERSONNEL',
  TECHNICIEN_MAINTENANCE = 'ROLE_TECHNICIEN_MAINTENANCE',
}

/** Normalise un rôle JWT (avec ou sans préfixe ROLE_). */
export function normalizeRole(role: string | null | undefined): string | null {
  if (!role) return null;
  let r = role.toUpperCase().replace(/-/g, '_');
  if (!r.startsWith('ROLE_')) r = `ROLE_${r}`;
  return r;
}

/** Compare deux rôles après normalisation. */
export function rolesMatch(
  userRole: string | null | undefined,
  expected: string,
): boolean {
  const a = normalizeRole(userRole);
  const b = normalizeRole(expected);
  return !!a && !!b && a === b;
}

// ── Libellés affichables ──────────────────────────────────────────────────────
export const roleLabels: Record<string, string> = {
  [Roles.SUPER_ADMIN]:    'Super Admin',
  [Roles.ADMIN_CLINIQUE]: 'Admin Clinique',
  [Roles.SECRETAIRE]:     'Secrétaire',
  [Roles.MEDECIN]:        'Médecin',
  [Roles.INFIRMIER]:      'Infirmier',
  [Roles.RADIOLOGUE]:     'Radiologue',
  [Roles.PHARMACIEN]:             'Pharmacien',
  [Roles.PATIENT]:                'Patient',
  [Roles.CHEF_PERSONNEL]:         'Chef du personnel',
  [Roles.TECHNICIEN_MAINTENANCE]: 'Technicien maintenance',
};

// ── Couleur LUNA associée au rôle ─────────────────────────────────────────────
export const roleColors: Record<string, keyof typeof LUNA_COLORS> = {
  [Roles.SUPER_ADMIN]:    'darkest',
  [Roles.ADMIN_CLINIQUE]: 'tertiary',
  [Roles.SECRETAIRE]:     'secondary',
  [Roles.MEDECIN]:        'dark',
  [Roles.INFIRMIER]:      'success',
  [Roles.RADIOLOGUE]:     'accentOrange',
  [Roles.PHARMACIEN]:     'accentGold',
  [Roles.PATIENT]:                'info',
  [Roles.CHEF_PERSONNEL]:         'tertiary',
  [Roles.TECHNICIEN_MAINTENANCE]: 'warning',
};

// ── Route initiale par rôle ───────────────────────────────────────────────────
export const ROLE_ROUTES: Record<string, string> = {
  // Avec préfixe ROLE_ (ce que Spring Security renvoie dans authorities)
  [Roles.SUPER_ADMIN]:    '/(superadmin)/dashboard',
  [Roles.ADMIN_CLINIQUE]: '/(admin)/dashboard',
  [Roles.SECRETAIRE]:     '/(secretaire)',
  [Roles.MEDECIN]:        '/(medecin)',
  [Roles.INFIRMIER]:      '/(infirmier)',
  [Roles.RADIOLOGUE]:     '/(radiologue)',
  [Roles.PHARMACIEN]:     '/(pharmacien)/stock',
  [Roles.PATIENT]:                '/(patient)/dossier',
  [Roles.CHEF_PERSONNEL]:         '/(chef-personnel)',
  [Roles.TECHNICIEN_MAINTENANCE]: '/(technicien)/equipements',
  // Sans préfixe ROLE_ (champ user.role du backend)
  'SUPER_ADMIN':            '/(superadmin)/dashboard',
  'ADMIN_CLINIQUE':         '/(admin)/dashboard',
  'SECRETAIRE':             '/(secretaire)',
  'MEDECIN':                '/(medecin)',
  'INFIRMIER':              '/(infirmier)',
  'RADIOLOGUE':             '/(radiologue)',
  'PHARMACIEN':             '/(pharmacien)/stock',
  'PATIENT':                '/(patient)/dossier',
  'CHEF_PERSONNEL':         '/(chef-personnel)',
  'TECHNICIEN_MAINTENANCE': '/(technicien)/equipements',
};
