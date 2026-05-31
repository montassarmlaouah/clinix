import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { HEADER_NAV_MENUS } from '@/src/constants/headerNav.config';
import {
  hasMedecinClinique,
  isMedecinCabinet,
  medecinShowCabinetMenus,
} from '@/src/utils/medecinContext';

export type RoleMenuIcon = ComponentProps<typeof Ionicons>['name'];

export interface RoleMenuItem {
  label: string;
  route: string;
  icon: RoleMenuIcon;
  description?: string;
}

function menu(
  roleKey: keyof typeof HEADER_NAV_MENUS,
  extras: RoleMenuItem[] = [],
  profilRoute: string,
): RoleMenuItem[] {
  return [
    ...(HEADER_NAV_MENUS[roleKey] ?? []),
    ...extras,
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: profilRoute, icon: 'person-circle-outline' },
  ];
}

export const ROLE_MENUS: Record<string, RoleMenuItem[]> = {
  ROLE_SUPER_ADMIN: menu('ROLE_SUPER_ADMIN', [], '/(superadmin)/profil'),
  ROLE_ADMIN_CLINIQUE: menu(
    'ROLE_ADMIN_CLINIQUE',
    [
      { label: 'Paiement Stripe', route: '/(admin)/abonnement-paiement', icon: 'card-outline' },
      { label: 'Facturation patient', route: '/(admin)/facturation-patient', icon: 'receipt-outline' },
    ],
    '/(admin)/profil',
  ),
  ROLE_SECRETAIRE: menu('ROLE_SECRETAIRE', [], '/(secretaire)/profil'),
  ROLE_MEDECIN: [],
  ROLE_INFIRMIER: menu(
    'ROLE_INFIRMIER',
    [
      { label: 'Scanner', route: '/(infirmier)/scanner', icon: 'scan-outline' },
    ],
    '/(infirmier)/profil',
  ),
  ROLE_RADIOLOGUE: menu('ROLE_RADIOLOGUE', [], '/(radiologue)/profil'),
  ROLE_PHARMACIEN: menu(
    'ROLE_PHARMACIEN',
    [{ label: 'Abonnement', route: '/(pharmacien)/abonnement', icon: 'card-outline' }],
    '/(pharmacien)/profil',
  ),
  ROLE_PATIENT: menu('ROLE_PATIENT', [], '/(patient)/profil'),
  ROLE_CHEF_PERSONNEL: menu('ROLE_CHEF_PERSONNEL', [], '/(chef-personnel)/profil'),
  ROLE_TECHNICIEN_MAINTENANCE: menu(
    'ROLE_TECHNICIEN_MAINTENANCE',
    [],
    '/(technicien)/profil',
  ),
};

export interface RoleMenuContext {
  estCabinet?: boolean;
  accesCabinet?: boolean;
  cliniqueId?: string | number | null;
}

function buildMedecinMenu(ctx: RoleMenuContext): RoleMenuItem[] {
  const { estCabinet = false, accesCabinet = false, cliniqueId = null } = ctx;
  const clinique = hasMedecinClinique(cliniqueId);
  const cabinet = medecinShowCabinetMenus(estCabinet, cliniqueId, accesCabinet);
  const cabinetOnly = isMedecinCabinet(estCabinet, cliniqueId) && !clinique;

  const items: RoleMenuItem[] = [
    { label: 'Messagerie', route: '/(medecin)/messagerie', icon: 'chatbubbles-outline' },
    { label: 'Demandes opération', route: '/(medecin)/demandes-operation', icon: 'medical-outline' },
    { label: 'Demandes médicament', route: '/(medecin)/demandes-medicament', icon: 'medkit-outline' },
    { label: 'Mes congés', route: '/(medecin)/conges', icon: 'airplane-outline' },
    { label: 'Mon abonnement', route: cabinetOnly ? '/(medecin)/abonnement?scope=cabinet' : '/(medecin)/abonnement', icon: 'card-outline' },
    ...(cabinet
      ? [
          { label: 'Forfaits cabinet', route: '/(medecin)/tarifs?scope=cabinet', icon: 'grid-outline' },
          { label: 'Paiement cabinet', route: '/(medecin)/abonnement-paiement?scope=cabinet', icon: 'card-outline' },
        ]
      : []),
    { label: 'Scanner', route: '/(medecin)/scanner', icon: 'scan-outline' },
    { label: 'Examens', route: '/(medecin)/examens', icon: 'flask-outline' },
    { label: 'Ordonnances', route: '/(medecin)/ordonnances', icon: 'medical-outline' },
    { label: 'Tâches infirmiers', route: '/(medecin)/taches-soins', icon: 'clipboard-outline' },
    { label: 'Notes confidentielles', route: '/(medecin)/notes', icon: 'lock-closed-outline' },
    { label: 'Opérations (planning)', route: '/(medecin)/operations', icon: 'cut-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(medecin)/profil', icon: 'person-circle-outline' },
  ];

  if (clinique) {
    items.unshift(
      { label: 'Patients clinique', route: '/(medecin)/patients?scope=clinique', icon: 'people-outline' },
      { label: 'Rendez-vous clinique', route: '/(medecin)/rendez-vous?scope=clinique', icon: 'calendar-outline' },
      { label: 'Hospitalisations', route: '/(medecin)/hospitalisations', icon: 'bed-outline' },
      { label: 'Urgences', route: '/(medecin)/alertes', icon: 'warning-outline' },
      { label: 'Planning bloc', route: '/(medecin)/planning', icon: 'calendar-outline' },
    );
  }

  if (cabinet) {
    const patientRoute = cabinetOnly
      ? '/(medecin)/patients'
      : '/(medecin)/patients?scope=cabinet';
    const rdvRoute = cabinetOnly
      ? '/(medecin)/rendez-vous'
      : '/(medecin)/rendez-vous?scope=cabinet';
    items.unshift(
      { label: 'Patients cabinet', route: patientRoute, icon: 'person-outline' },
      { label: 'Rendez-vous cabinet', route: rdvRoute, icon: 'calendar-outline' },
    );
  }

  if (!clinique && !cabinet) {
    items.unshift(
      { label: 'Patients', route: '/(medecin)/patients', icon: 'people-outline' },
      { label: 'Rendez-vous', route: '/(medecin)/rendez-vous', icon: 'calendar-outline' },
    );
  }

  return items;
}

function dedupeMenuItems(items: RoleMenuItem[]): RoleMenuItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.route)) return false;
    seen.add(item.route);
    return true;
  });
}

export function getRoleMenu(role: string | null, ctx: RoleMenuContext = {}): RoleMenuItem[] {
  if (!role) return [];
  const key = ROLE_MENUS[role] ? role : ROLE_MENUS[`ROLE_${role}`] ? `ROLE_${role}` : role;
  const normalized = ROLE_MENUS[key] !== undefined ? key : `ROLE_${role}`;

  if (normalized === 'ROLE_MEDECIN' || role === 'MEDECIN') {
    return dedupeMenuItems(buildMedecinMenu(ctx));
  }

  let items: RoleMenuItem[] = [];
  if (ROLE_MENUS[normalized]) items = [...ROLE_MENUS[normalized]];
  else if (ROLE_MENUS[role]) items = [...ROLE_MENUS[role]];
  return dedupeMenuItems(items);
}
