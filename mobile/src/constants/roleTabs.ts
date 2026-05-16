/** 3 onglets visibles max par rôle (icônes seules). Le reste = Accès rapide sur l’accueil. */
export const ROLE_TAB_ROUTES: Record<string, readonly string[]> = {
  ROLE_SUPER_ADMIN: [
    '/(superadmin)/dashboard',
    '/(superadmin)/organisations',
    '/(superadmin)/abonnements',
  ],
  ROLE_ADMIN_CLINIQUE: [
    '/(admin)/dashboard',
    '/(admin)/patients',
    '/(admin)/personnel',
  ],
  ROLE_SECRETAIRE: [
    '/(secretaire)/index',
    '/(secretaire)/rendez-vous',
    '/(secretaire)/patients',
  ],
  ROLE_MEDECIN: [
    '/(medecin)/index',
    '/(medecin)/patients',
    '/(medecin)/messagerie',
  ],
  ROLE_INFIRMIER: [
    '/(infirmier)/index',
    '/(infirmier)/patients',
    '/(infirmier)/soins',
  ],
  ROLE_RADIOLOGUE: [
    '/(radiologue)/index',
    '/(radiologue)/demandes',
    '/(radiologue)/rapports',
  ],
  ROLE_PHARMACIEN: [
    '/(pharmacien)/index',
    '/(pharmacien)/stock',
    '/(pharmacien)/demandes',
  ],
  ROLE_PATIENT: [
    '/(patient)/dossier',
    '/(patient)/ordonnances',
    '/(patient)/rendez-vous',
  ],
  ROLE_CHEF_PERSONNEL: [
    '/(chef-personnel)/index',
    '/(chef-personnel)/planning',
    '/(chef-personnel)/presences',
  ],
  ROLE_TECHNICIEN_MAINTENANCE: [
    '/(technicien)/index',
    '/(technicien)/equipements',
    '/(technicien)/pannes',
  ],
};

export function getRoleTabRoutes(role: string | null | undefined): string[] {
  if (!role) return [];
  if (ROLE_TAB_ROUTES[role]) return [...ROLE_TAB_ROUTES[role]];
  const prefixed = `ROLE_${role}`;
  if (ROLE_TAB_ROUTES[prefixed]) return [...ROLE_TAB_ROUTES[prefixed]];
  return [];
}
