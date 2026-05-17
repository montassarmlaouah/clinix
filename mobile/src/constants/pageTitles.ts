/** Titres par défaut selon le dernier segment de route. */
const SEGMENT_TITLES: Record<string, { title: string; subtitle?: string }> = {
  index: { title: 'Accueil' },
  dashboard: { title: 'Dashboard' },
  profil: { title: 'Paramètre' },
  menu: { title: 'Menu' },
  patients: { title: 'Patients' },
  'rendez-vous': { title: 'Agenda' },
  services: { title: 'Services' },
  chambres: { title: 'Chambres' },
  equipements: { title: 'Équipements' },
  personnel: { title: 'Personnel' },
  notifications: { title: 'Notifications' },
  admissions: { title: 'Admissions' },
  transferts: { title: 'Transferts' },
  messagerie: { title: 'Messages' },
  planning: { title: 'Planning' },
  operations: { title: 'Opérations' },
  presences: { title: 'Présences' },
  demandes: { title: 'Demandes' },
  rapports: { title: 'Rapports' },
  agenda: { title: 'Agenda' },
  stock: { title: 'Pharmacie' },
  alertes: { title: 'Alertes' },
  pannes: { title: 'Pannes' },
  dossier: { title: 'Mon dossier médical' },
  abonnements: { title: 'Abonnements' },
  organisations: { title: 'Cliniques' },
  abonnement: { title: 'Facturation patient', subtitle: 'Sortie · CNAM · PDF' },
  tarifs: { title: 'Forfaits' },
  'abonnement-paiement': { title: 'Paiement' },
  'demandes-operation': { title: 'Demandes opération' },
  'demandes-medicament': { title: 'Demandes médicaments' },
  'conges-medecin': { title: 'Congés médecins' },
  examens: { title: 'Examens' },
  statistiques: { title: 'Statistiques' },
  notes: { title: 'Notes' },
  ordonnances: { title: 'Ordonnances' },
  hospitalisations: { title: 'Hospitalisations' },
  scanner: { title: 'Scanner patient' },
  nouveau: { title: 'Nouveau' },
  creer: { title: 'Créer' },
};

export function getDefaultPageTitle(segments: string[]): { title: string; subtitle?: string } {
  const filtered = segments.filter(
    (s) => s && !s.startsWith('(') && s !== 'notifications',
  );
  const last = filtered[filtered.length - 1];
  if (!last) return { title: 'Accueil' };
  if (SEGMENT_TITLES[last]) return SEGMENT_TITLES[last];
  if (last === '[id]') {
    const prev = filtered[filtered.length - 2];
    if (prev === 'patients') return { title: 'Fiche patient' };
    if (prev === 'rendez-vous') return { title: 'Rendez-vous' };
    if (prev === 'transferts') return { title: 'Transfert' };
    return { title: 'Détail' };
  }
  return { title: last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ') };
}
