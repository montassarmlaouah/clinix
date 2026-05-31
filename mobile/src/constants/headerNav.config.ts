import type { RoleMenuItem } from '@/src/constants/roleMenus';

/**
 * Menus latéraux alignés sur Frontend/src/app/header/header.html
 * (routes mobile expo-router équivalentes).
 */
export const HEADER_NAV_MENUS: Record<string, RoleMenuItem[]> = {
  ROLE_SUPER_ADMIN: [
    { label: 'Dashboard', route: '/(superadmin)/dashboard', icon: 'speedometer-outline' },
    { label: 'Cliniques', route: '/(superadmin)/organisations', icon: 'business-outline' },
    { label: 'Cabinets médecins', route: '/(superadmin)/medecins-admin', icon: 'person-outline' },
    { label: 'Abonnements Stripe', route: '/(superadmin)/abonnements', icon: 'card-outline' },
    { label: 'Config Stripe', route: '/(superadmin)/stripe-config', icon: 'settings-outline' },
  ],
  ROLE_ADMIN_CLINIQUE: [
    { label: 'Dashboard', route: '/(admin)/dashboard', icon: 'speedometer-outline' },
    { label: 'Personnel', route: '/(admin)/personnel', icon: 'people-outline' },
    { label: 'Services Médicaux', route: '/(admin)/services', icon: 'medical-outline' },
    { label: 'Chambres', route: '/(admin)/chambres', icon: 'bed-outline' },
    { label: 'Gestion des équipements', route: '/(admin)/equipements', icon: 'construct-outline' },
    { label: 'Mon abonnement', route: '/(admin)/abonnement', icon: 'card-outline' },
    { label: 'Forfaits & paiement', route: '/(admin)/tarifs', icon: 'grid-outline' },
    { label: 'Facturation patient', route: '/(admin)/facturation-patient', icon: 'receipt-outline' },
  ],
  ROLE_SECRETAIRE: [
    { label: 'Dashboard', route: '/(secretaire)/index', icon: 'speedometer-outline' },
    { label: 'Patients', route: '/(secretaire)/patients', icon: 'people-outline' },
    { label: 'Chambres — entrée / sortie', route: '/(secretaire)/chambres', icon: 'bed-outline' },
    { label: 'Rendez-vous', route: '/(secretaire)/rendez-vous', icon: 'calendar-outline' },
    { label: 'Médecins disponibles', route: '/(secretaire)/conges-medecin', icon: 'person-outline' },
    { label: "Demandes d'opération", route: '/(secretaire)/demandes-operation', icon: 'heart-outline' },
    { label: 'Facturation patient', route: '/(secretaire)/abonnement', icon: 'receipt-outline' },
  ],
  ROLE_TECHNICIEN_MAINTENANCE: [
    { label: 'Dashboard', route: '/(technicien)/index', icon: 'speedometer-outline' },
    { label: 'Équipements', route: '/(technicien)/equipements', icon: 'construct-outline' },
    { label: 'Pannes', route: '/(technicien)/pannes', icon: 'warning-outline' },
  ],
  ROLE_INFIRMIER: [
    { label: 'Dashboard', route: '/(infirmier)/index', icon: 'speedometer-outline' },
    { label: 'Patients', route: '/(infirmier)/patients', icon: 'people-outline' },
    { label: 'Mon Planning', route: '/(infirmier)/planning', icon: 'calendar-outline' },
    { label: 'Demande Congé', route: '/(infirmier)/congie', icon: 'airplane-outline' },
    { label: 'Demandes Médicaments', route: '/(infirmier)/demandes-medicament', icon: 'medkit-outline' },
    { label: 'Tâches & soins', route: '/(infirmier)/taches-soins', icon: 'list-outline' },
    { label: 'Soins du jour', route: '/(infirmier)/soins', icon: 'medkit-outline' },
    { label: 'Soins & surveillance', route: '/(infirmier)/surveillance-soins', icon: 'pulse-outline' },
    { label: 'Visites du jour', route: '/(infirmier)/visites-jour', icon: 'today-outline' },
    { label: 'Rendez-vous', route: '/(infirmier)/rendez-vous', icon: 'calendar-outline' },
    { label: 'Hospitalisations', route: '/(infirmier)/hospitalisations', icon: 'bed-outline' },
    { label: 'Alertes', route: '/(infirmier)/alertes', icon: 'warning-outline' },
    { label: 'Signalements', route: '/(infirmier)/signalements', icon: 'alert-circle-outline' },
    { label: 'Bracelet patient', route: '/(infirmier)/bracelet', icon: 'bandage-outline' },
    { label: 'Scanner', route: '/(infirmier)/scanner', icon: 'scan-outline' },
    { label: 'Chambres', route: '/(infirmier)/chambres', icon: 'bed-outline' },
    { label: 'Présences', route: '/(infirmier)/presences', icon: 'time-outline' },
    { label: "Demandes d'opération", route: '/(infirmier)/demandes-operation', icon: 'heart-outline' },
    { label: 'Check-list bloc', route: '/(infirmier)/check-list', icon: 'checkbox-outline' },
    { label: 'SSPI', route: '/(infirmier)/sspi', icon: 'analytics-outline' },
    { label: 'Transmissions', route: '/(infirmier)/transmissions', icon: 'chatbox-outline' },
  ],
  ROLE_CHEF_PERSONNEL: [
    { label: 'Dashboard', route: '/(chef-personnel)/index', icon: 'speedometer-outline' },
    { label: 'Planning infirmiers', route: '/(chef-personnel)/planning', icon: 'calendar-outline' },
    { label: 'Présences', route: '/(chef-personnel)/presences', icon: 'time-outline' },
    { label: 'Congés infirmiers', route: '/(chef-personnel)/conges', icon: 'airplane-outline' },
    { label: 'Congés médecins', route: '/(chef-personnel)/conges-medecin', icon: 'medical-outline' },
  ],
  ROLE_RADIOLOGUE: [
    { label: 'Dashboard', route: '/(radiologue)/index', icon: 'speedometer-outline' },
    { label: "File d'attente", route: '/(radiologue)/demandes', icon: 'time-outline' },
    { label: 'Mes examens', route: '/(radiologue)/rapports', icon: 'document-text-outline' },
    { label: 'Agenda', route: '/(radiologue)/agenda', icon: 'calendar-outline' },
    { label: 'Messagerie', route: '/(radiologue)/messagerie', icon: 'chatbubbles-outline' },
  ],
  ROLE_PHARMACIEN: [
    { label: 'Dashboard', route: '/(pharmacien)/index', icon: 'speedometer-outline' },
    { label: 'Stock', route: '/(pharmacien)/stock', icon: 'medkit-outline' },
    { label: 'Demandes', route: '/(pharmacien)/demandes', icon: 'clipboard-outline' },
    { label: 'Pharmacie complète', route: '/(pharmacien)/pharmacie', icon: 'grid-outline' },
  ],
  ROLE_PATIENT: [
    { label: 'Dashboard', route: '/(patient)/dossier', icon: 'speedometer-outline' },
    { label: 'Mon espace santé', route: '/(patient)/dossier', icon: 'heart-outline' },
    { label: 'Mes rendez-vous', route: '/(patient)/rendez-vous', icon: 'calendar-outline' },
    { label: 'Dossier médical', route: '/(patient)/dossier', icon: 'folder-open-outline' },
    { label: 'Ordonnances', route: '/(patient)/ordonnances', icon: 'medical-outline' },
    { label: 'Résultats analyses', route: '/(patient)/resultats', icon: 'flask-outline' },
    { label: 'Téléconsultation', route: '/(patient)/teleconsultation', icon: 'videocam-outline' },
  ],
};

/** Onglets barre du bas (sous-ensemble header — reste dans le drawer). */
export const HEADER_BOTTOM_TABS: Record<string, readonly { route: string; title: string; icon: RoleMenuItem['icon'] }[]> = {
  ROLE_SECRETAIRE: [
    { route: '/(secretaire)/index',             title: 'Dashboard',             icon: 'speedometer-outline' },
    { route: '/(secretaire)/patients',           title: 'Patients',              icon: 'people-outline' },
    { route: '/(secretaire)/rendez-vous',        title: 'Rendez-vous',           icon: 'calendar-outline' },
    { route: '/(secretaire)/demandes-operation', title: "Demandes d'opération",  icon: 'heart-outline' },
    { route: '/(secretaire)/conges-medecin',     title: 'Médecins disponibles',  icon: 'person-outline' },
    { route: '/(secretaire)/chambres',           title: 'Chambres',              icon: 'bed-outline' },
    { route: '/(secretaire)/abonnement',         title: 'Facturation patient',   icon: 'receipt-outline' },
  ],
  ROLE_TECHNICIEN_MAINTENANCE: [
    { route: '/(technicien)/index', title: 'Dashboard', icon: 'speedometer-outline' },
    { route: '/(technicien)/equipements', title: 'Équipements', icon: 'construct-outline' },
  ],
};
