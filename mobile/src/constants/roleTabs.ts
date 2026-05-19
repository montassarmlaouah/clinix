import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

/** Onglets visibles dans la barre du bas. Le reste = menu latéral / accès rapide. */
export const ADMIN_NAV_TAB_ROUTES = [
  '/(admin)/dashboard',
  '/(admin)/services',
  '/(admin)/chambres',
  '/(admin)/equipements',
] as const;

/** Icônes alignées sur le menu / accès rapide (outline Ionicons). */
export const ADMIN_TAB_SCREENS: ReadonlyArray<{
  name: 'dashboard' | 'services' | 'chambres' | 'equipements';
  icon: IonIcon;
}> = [
  { name: 'dashboard', icon: 'speedometer-outline' },
  { name: 'services', icon: 'medical-outline' },
  { name: 'chambres', icon: 'bed-outline' },
  { name: 'equipements', icon: 'construct-outline' },
];

export const ROLE_TAB_ROUTES: Record<string, readonly string[]> = {
  ROLE_SUPER_ADMIN: [
    '/(superadmin)/dashboard',
    '/(superadmin)/organisations',
    '/(superadmin)/abonnements',
  ],
  ROLE_ADMIN_CLINIQUE: [...ADMIN_NAV_TAB_ROUTES],
  ROLE_SECRETAIRE: [
    '/(secretaire)/index',
    '/(secretaire)/patients',
    '/(secretaire)/rendez-vous',
    '/(secretaire)/demandes-operation',
    '/(secretaire)/conges-medecin',
    '/(secretaire)/chambres',
    '/(secretaire)/abonnement',
  ],
  ROLE_INFIRMIER: [
    '/(infirmier)/index',
    '/(infirmier)/patients',
    '/(infirmier)/soins',
    '/(infirmier)/menu',
  ],
  ROLE_MEDECIN: [
    '/(medecin)/index',
    '/(medecin)/patients',
    '/(medecin)/messagerie',
    '/(medecin)/menu',
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
  ],
};

export function getRoleTabRoutes(role: string | null | undefined): string[] {
  if (!role) return [];
  if (ROLE_TAB_ROUTES[role]) return [...ROLE_TAB_ROUTES[role]];
  const prefixed = `ROLE_${role}`;
  if (ROLE_TAB_ROUTES[prefixed]) return [...ROLE_TAB_ROUTES[prefixed]];
  return [];
}
