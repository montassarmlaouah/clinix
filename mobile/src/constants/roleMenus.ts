import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

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

export const ROLE_MENUS: Record<string, RoleMenuItem[]> = {
  ROLE_SUPER_ADMIN: [
    { label: 'Dashboard', route: '/(superadmin)/dashboard', icon: 'speedometer-outline' },
    { label: 'Cliniques', route: '/(superadmin)/organisations', icon: 'business-outline' },
    { label: 'Cabinets médecins', route: '/(superadmin)/medecins-admin', icon: 'person-outline' },
    { label: 'Abonnements Stripe', route: '/(superadmin)/abonnements', icon: 'card-outline' },
    { label: 'Config Stripe', route: '/(superadmin)/stripe-config', icon: 'card-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(superadmin)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_ADMIN_CLINIQUE: [
    { label: 'Dashboard', route: '/(admin)/dashboard', icon: 'speedometer-outline' },
    { label: 'Personnel', route: '/(admin)/personnel', icon: 'people-outline' },
    { label: 'Services médicaux', route: '/(admin)/services', icon: 'medical-outline' },
    { label: 'Chambres', route: '/(admin)/chambres', icon: 'bed-outline' },
    { label: 'Équipements', route: '/(admin)/equipements', icon: 'construct-outline' },
    { label: 'Mon abonnement', route: '/(admin)/abonnement', icon: 'card-outline' },
    { label: 'Forfaits', route: '/(admin)/tarifs', icon: 'grid-outline' },
    { label: 'Paiement Stripe', route: '/(admin)/abonnement-paiement', icon: 'card-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(admin)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_SECRETAIRE: [
    { label: 'Accueil', route: '/(secretaire)/index', icon: 'home-outline' },
    { label: 'Patients', route: '/(secretaire)/patients', icon: 'people-outline' },
    { label: 'Chambres', route: '/(secretaire)/chambres', icon: 'bed-outline' },
    { label: 'Rendez-vous', route: '/(secretaire)/rendez-vous', icon: 'calendar-outline' },
    { label: 'Admissions', route: '/(secretaire)/admissions', icon: 'enter-outline' },
    { label: 'Transferts', route: '/(secretaire)/transferts', icon: 'swap-horizontal-outline' },
    { label: 'Médecins disponibles', route: '/(secretaire)/conges-medecin', icon: 'person-outline' },
    { label: 'Demandes opération', route: '/(secretaire)/demandes-operation', icon: 'medical-outline' },
    { label: 'Demandes médicament', route: '/(secretaire)/demandes-medicament', icon: 'medkit-outline' },
    { label: 'Facturation', route: '/(secretaire)/abonnement', icon: 'card-outline' },
    { label: 'Forfaits', route: '/(secretaire)/tarifs', icon: 'grid-outline' },
    { label: 'Paiement Stripe', route: '/(secretaire)/abonnement-paiement', icon: 'card-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(secretaire)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_MEDECIN: [],
  ROLE_INFIRMIER: [
    { label: 'Accueil', route: '/(infirmier)/index', icon: 'home-outline' },
    { label: 'Liste des patients', route: '/(infirmier)/patients', icon: 'list-outline' },
    { label: 'Soins à administrer', route: '/(infirmier)/soins', icon: 'medkit-outline' },
    { label: 'Planning bloc', route: '/(infirmier)/planning', icon: 'calendar-outline' },
    { label: 'Bracelet', route: '/(infirmier)/bracelet', icon: 'bandage-outline' },
    { label: 'Scanner', route: '/(infirmier)/scanner', icon: 'scan-outline' },
    { label: 'Visites du jour', route: '/(infirmier)/visites-jour', icon: 'home-outline' },
    { label: 'Hospitalisations', route: '/(infirmier)/hospitalisations', icon: 'bed-outline' },
    { label: 'Signalements', route: '/(infirmier)/signalements', icon: 'megaphone-outline' },
    { label: 'Alertes', route: '/(infirmier)/alertes', icon: 'warning-outline' },
    { label: 'Check-list', route: '/(infirmier)/check-list', icon: 'checkbox-outline' },
    { label: 'SSPI', route: '/(infirmier)/sspi', icon: 'pulse-outline' },
    { label: 'Transmissions', route: '/(infirmier)/transmissions', icon: 'chatbox-outline' },
    { label: 'Demande congé', route: '/(infirmier)/congie', icon: 'airplane-outline' },
    { label: 'Mes présences', route: '/(infirmier)/presences', icon: 'time-outline' },
    { label: 'Demandes médicament', route: '/(infirmier)/demandes-medicament', icon: 'medkit-outline' },
    { label: 'Demandes opération', route: '/(infirmier)/demandes-operation', icon: 'medical-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(infirmier)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_RADIOLOGUE: [
    { label: 'Dashboard', route: '/(radiologue)/index', icon: 'grid-outline' },
    { label: 'File d\'attente', route: '/(radiologue)/demandes', icon: 'time-outline' },
    { label: 'Mes examens', route: '/(radiologue)/rapports', icon: 'document-text-outline' },
    { label: 'Agenda', route: '/(radiologue)/agenda', icon: 'calendar-outline' },
    { label: 'Messagerie', route: '/(radiologue)/messagerie', icon: 'chatbubbles-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(radiologue)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_PHARMACIEN: [
    { label: 'Accueil', route: '/(pharmacien)/index', icon: 'home-outline' },
    { label: 'Stock', route: '/(pharmacien)/stock', icon: 'medkit-outline' },
    { label: 'Demandes', route: '/(pharmacien)/demandes', icon: 'clipboard-outline' },
    { label: 'Alertes stock', route: '/(pharmacien)/alertes', icon: 'warning-outline' },
    { label: 'Pharmacie complète', route: '/(pharmacien)/pharmacie', icon: 'grid-outline' },
    { label: 'Abonnement', route: '/(pharmacien)/abonnement', icon: 'card-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(pharmacien)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_PATIENT: [
    { label: 'Mon dossier', route: '/(patient)/dossier', icon: 'folder-open-outline' },
    { label: 'Ordonnances', route: '/(patient)/ordonnances', icon: 'document-text-outline' },
    { label: 'Résultats', route: '/(patient)/resultats', icon: 'flask-outline' },
    { label: 'Rendez-vous', route: '/(patient)/rendez-vous', icon: 'calendar-outline' },
    { label: 'Téléconsultation', route: '/(patient)/teleconsultation', icon: 'videocam-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(patient)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_CHEF_PERSONNEL: [
    { label: 'Accueil', route: '/(chef-personnel)/index', icon: 'home-outline' },
    { label: 'Planning infirmiers', route: '/(chef-personnel)/planning', icon: 'calendar-outline' },
    { label: 'Présences', route: '/(chef-personnel)/presences', icon: 'time-outline' },
    { label: 'Congés infirmiers', route: '/(chef-personnel)/conges', icon: 'airplane-outline' },
    { label: 'Congés médecins', route: '/(chef-personnel)/conges-medecin', icon: 'medical-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(chef-personnel)/profil', icon: 'person-circle-outline' },
  ],
  ROLE_TECHNICIEN_MAINTENANCE: [
    { label: 'Accueil', route: '/(technicien)/index', icon: 'home-outline' },
    { label: 'Équipements', route: '/(technicien)/equipements', icon: 'construct-outline' },
    { label: 'Pannes', route: '/(technicien)/pannes', icon: 'warning-outline' },
    { label: 'Chambres', route: '/(technicien)/chambres', icon: 'bed-outline' },
    { label: 'Abonnement', route: '/(technicien)/abonnement', icon: 'card-outline' },
    { label: 'Notifications', route: '/notifications', icon: 'notifications-outline' },
    { label: 'Profil', route: '/(technicien)/profil', icon: 'person-circle-outline' },
  ],
};

export interface RoleMenuContext {
  estCabinet?: boolean;
  cliniqueId?: string | number | null;
}

function buildMedecinMenu(ctx: RoleMenuContext): RoleMenuItem[] {
  const { estCabinet = false, cliniqueId = null } = ctx;
  const clinique = hasMedecinClinique(cliniqueId);
  const cabinet = medecinShowCabinetMenus(estCabinet, cliniqueId);
  const cabinetOnly = isMedecinCabinet(estCabinet, cliniqueId) && !clinique;

  const items: RoleMenuItem[] = [
    { label: 'Dashboard', route: '/(medecin)/index', icon: 'pulse-outline' },
    { label: 'Statistiques', route: '/(medecin)/statistiques', icon: 'stats-chart-outline' },
    { label: 'Messagerie', route: '/(medecin)/messagerie', icon: 'chatbubbles-outline' },
    { label: 'Demandes opération', route: '/(medecin)/demandes-operation', icon: 'medical-outline' },
    { label: 'Demandes médicament', route: '/(medecin)/demandes-medicament', icon: 'medkit-outline' },
    { label: 'Mes congés', route: '/(medecin)/conges', icon: 'airplane-outline' },
    { label: 'Mon abonnement', route: '/(medecin)/abonnement', icon: 'card-outline' },
    { label: 'Forfaits', route: '/(medecin)/tarifs', icon: 'grid-outline' },
    { label: 'Paiement Stripe', route: '/(medecin)/abonnement-paiement', icon: 'card-outline' },
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
