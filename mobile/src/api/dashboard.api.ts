/**
 * dashboard.api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Agrégateurs par rôle — chaque fonction appelle des endpoints EXISTANTS dans
 * le backend Spring Boot et construit localement le DashboardStatsResponse.
 * Aucun endpoint inventé, aucune donnée mockée.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { apiGet } from '@/src/api/client';
import {
  ADMINISTRATIONS,
  BILLING,
  CHAMBRES,
  CLINIQUES,
  CONGES_MEDECIN,
  CONSULTATIONS,
  DEMANDES_MEDICAMENT,
  EQUIPEMENTS,
  HOSPITALISATIONS,
  IMAGERIES,
  MAINTENANCES,
  MEDECINS,
  ORDONNANCES,
  PATIENTS,
  PERSONNEL,
  PRESENCES,
  RADIOLOGUE_WORKSPACE,
  RDV,
  SERVICES,
  STOCKS,
  SURVEILLANCES,
  TECHNICIEN_MAINTENANCE,
  CONSTANTES,
} from '@/src/api/endpoints';
import { CHART_PALETTE } from '@/src/constants/chartColors';
import type {
  BarChartPoint,
  DashboardRole,
  DashboardStatsResponse,
  KPIStat,
  LineChartPoint,
  PieChartPoint,
} from '@/src/types/dashboard.types';

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Compte combien d'éléments existent dans chaque groupe (par valeur d'une clé). */
function groupCount<T>(arr: T[], key: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const k = String(item[key] ?? 'Autre');
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

/** Convertit un groupCount en BarChartPoints. */
function toBarPoints(counts: Record<string, number>): BarChartPoint[] {
  return Object.entries(counts).map(([label, value], i) => ({
    label: label.length > 10 ? label.substring(0, 9) + '…' : label,
    value,
    frontColor: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
}

/** Convertit un groupCount en PieChartPoints. */
function toPiePoints(counts: Record<string, number>): PieChartPoint[] {
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts).map(([label, value], i) => ({
    label,
    value,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
    text: `${Math.round((value / total) * 100)}%`,
  }));
}

/** Regroupe des items par semaine (sur les 8 dernières semaines) selon un champ date ISO. */
function weeklyTrend<T>(arr: T[], dateField: keyof T): LineChartPoint[] {
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const buckets = Array.from({ length: 8 }, (_, i) => ({
    label: `S${8 - i}`,
    cutoff: now - i * week,
    count: 0,
  })).reverse();

  for (const item of arr) {
    const raw = item[dateField] as unknown;
    if (!raw) continue;
    const ts = new Date(raw as string).getTime();
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (ts <= buckets[i].cutoff && (i === 0 || ts > buckets[i - 1].cutoff)) {
        buckets[i].count++;
        break;
      }
    }
  }
  return buckets.map((b) => ({ value: b.count, label: b.label }));
}

/** safe apiGet — retourne [] ou {} sans planter si 404/500 */
async function safeGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await apiGet<T>(url);
    return r ?? fallback;
  } catch {
    return fallback;
  }
}

// ── Admin Clinique ────────────────────────────────────────────────────────────
async function fetchAdminStats(cliniqueId: string | number): Promise<DashboardStatsResponse> {
  const cid = String(cliniqueId);

  const [med, inf, sec, phar, rad, chefs, tech, services, chambres, equipements, patients, rdvs] =
    await Promise.all([
      safeGet<any[]>(`${PERSONNEL.MEDECINS}?cliniqueId=${cid}`, []),
      safeGet<any[]>(`${PERSONNEL.INFIRMIERS}?cliniqueId=${cid}`, []),
      safeGet<any[]>(`${PERSONNEL.SECRETAIRES}?cliniqueId=${cid}`, []),
      safeGet<any[]>(`${PERSONNEL.PHARMACIENS}?cliniqueId=${cid}`, []),
      safeGet<any[]>(`${PERSONNEL.RADIOLOGUES}?cliniqueId=${cid}`, []),
      safeGet<any[]>(`${PERSONNEL.CHEFS}?cliniqueId=${cid}`, []),
      safeGet<any[]>(`${PERSONNEL.TECHNICIENS}?cliniqueId=${cid}`, []),
      safeGet<any[]>(SERVICES.BY_CLINIQUE(cid), []),
      safeGet<any[]>(CHAMBRES.BY_CLINIQUE(cid), []),
      safeGet<any[]>(EQUIPEMENTS.BY_CLINIQUE(cid), []),
      safeGet<any[]>(PATIENTS.BY_CLINIQUE(cid), []),
      safeGet<any[]>(RDV.BY_CLINIQUE(cid), []),
    ]);

  const totalPersonnel = med.length + inf.length + sec.length + phar.length + rad.length + chefs.length + tech.length;
  const chambresOccupees = chambres.filter((c: any) => c.statut === 'OCCUPEE' || c.occupe === true).length;
  const chambresLibres = chambres.length - chambresOccupees;

  const kpis: KPIStat[] = [
    { label: 'Patients',    value: patients.length,    icon: 'patients',    color: '#2d9cdb' },
    { label: 'Personnel',   value: totalPersonnel,     icon: 'personnel',   color: '#26658c' },
    { label: 'Services',    value: services.length,    icon: 'services',    color: '#4ecdc4' },
    { label: 'Chambres',    value: chambres.length,    icon: 'chambres',    color: '#16a34a' },
    { label: 'Équipements', value: equipements.length, icon: 'equipements', color: '#d97706' },
    { label: 'RDV',         value: rdvs.length,        icon: 'rendez',      color: '#7c3aed' },
  ];

  const personnelByRole: BarChartPoint[] = [
    { label: 'Méd.',  value: med.length,   frontColor: '#2d9cdb' },
    { label: 'Inf.',  value: inf.length,   frontColor: '#4ecdc4' },
    { label: 'Sec.',  value: sec.length,   frontColor: '#26658c' },
    { label: 'Phar.', value: phar.length,  frontColor: '#16a34a' },
    { label: 'Rad.',  value: rad.length,   frontColor: '#d97706' },
    { label: 'Chef',  value: chefs.length, frontColor: '#7c3aed' },
    { label: 'Tech.', value: tech.length,  frontColor: '#db2777' },
  ].filter((p) => p.value > 0);

  const serviceOccupancy: PieChartPoint[] = chambres.length > 0
    ? [
        { label: 'Occupées', value: chambresOccupees, color: '#2d9cdb', text: `${chambresOccupees}` },
        { label: 'Libres',   value: Math.max(chambresLibres, 0), color: '#4ecdc4', text: `${Math.max(chambresLibres, 0)}` },
      ].filter((p) => p.value > 0)
    : [];

  const patientsByStatus = toPiePoints(groupCount(patients, 'statut')).filter((p) => p.value > 0);
  const appointmentsEvolution = weeklyTrend(rdvs, 'dateHeure');

  return { kpis, personnelByRole, serviceOccupancy, patientsByStatus, appointmentsEvolution };
}

// ── Super Admin ───────────────────────────────────────────────────────────────
async function fetchSuperAdminStats(): Promise<DashboardStatsResponse> {
  const [cliniques, cabinets, abonnements] = await Promise.all([
    safeGet<any[]>(CLINIQUES.LIST, []),
    safeGet<any[]>(MEDECINS.CABINETS, []),
    safeGet<any[]>(BILLING.ABONNEMENTS_ACTIFS, []),
  ]);

  const actives  = cliniques.filter((c: any) => c.actif !== false && c.statut !== 'INACTIF').length;
  const inactives = cliniques.length - actives;

  const kpis: KPIStat[] = [
    { label: 'Cliniques',      value: cliniques.length,   icon: 'cliniques',    color: '#2d9cdb' },
    { label: 'Actives',        value: actives,            icon: 'cliniques',    color: '#16a34a' },
    { label: 'Cabinets',       value: cabinets.length,    icon: 'personnel',    color: '#26658c' },
    { label: 'Abonnements',    value: abonnements.length, icon: 'abonnements',  color: '#7c3aed' },
  ];

  const subscriptionsByPlan = toPiePoints(groupCount(abonnements, 'nomOffre')).filter((p) => p.value > 0);

  const subscriptionsStats: BarChartPoint[] = subscriptionsByPlan.map((p) => ({
    label:       p.label ?? '',
    value:       p.value,
    frontColor:  p.color,
  }));

  const cliniquesGrowth = weeklyTrend(cliniques, 'dateCreation');

  const cliniquesStatus: PieChartPoint[] = [
    { label: 'Actives',   value: actives,            color: '#16a34a', text: `${actives}` },
    { label: 'Inactives', value: Math.max(inactives, 0), color: '#dc2626', text: `${Math.max(inactives, 0)}` },
  ].filter((p) => p.value > 0);

  return { kpis, subscriptionsByPlan: cliniquesStatus, subscriptionsStats, cliniquesGrowth };
}

// ── Médecin ───────────────────────────────────────────────────────────────────
async function fetchMedecinStats(userId: string | number, cliniqueId?: string | number | null): Promise<DashboardStatsResponse> {
  const mid = String(userId);

  const [patients, consultations, ordonnances, rdvs] = await Promise.all([
    safeGet<any[]>(MEDECINS.PATIENTS_LIST(mid), []),
    safeGet<any[]>(CONSULTATIONS.BY_MEDECIN(mid), []),
    safeGet<any[]>(`${ORDONNANCES.LIST}?medecinId=${mid}`, []),
    cliniqueId
      ? safeGet<any[]>(RDV.BY_MEDECIN_CLINIQUE(mid, cliniqueId), [])
      : safeGet<any[]>(RDV.BY_MEDECIN(mid), []),
  ]);

  const hospitOccupation = patients.filter((p: any) =>
    (p.statut ?? '').toUpperCase().includes('HOSPITALISE'),
  ).length;

  const kpis: KPIStat[] = [
    { label: 'Patients suivis',    value: patients.length,       icon: 'patients',       color: '#2d9cdb' },
    { label: 'Consultations',      value: consultations.length,  icon: 'consultations',  color: '#26658c' },
    { label: 'Ordonnances',        value: ordonnances.length,    icon: 'ordonnances',    color: '#4ecdc4' },
    { label: 'RDV',                value: rdvs.length,           icon: 'rendez',         color: '#16a34a' },
    { label: 'Hospitalisés',       value: hospitOccupation,      icon: 'patients',       color: '#d97706' },
  ];

  const patientsByStatus = toPiePoints(groupCount(patients, 'statut')).filter((p) => p.value > 0);
  const consultationsEvolution = weeklyTrend(consultations, 'dateConsultation');
  const appointmentsByHour = (() => {
    const hours: Record<string, number> = {};
    for (const rdv of rdvs) {
      const d = rdv.dateHeure ? new Date(rdv.dateHeure) : null;
      if (!d) continue;
      const h = `${d.getHours()}h`;
      hours[h] = (hours[h] ?? 0) + 1;
    }
    return toBarPoints(hours);
  })();

  return { kpis, patientsByStatus, consultationsEvolution, appointmentsByHour };
}

// ── Infirmier ─────────────────────────────────────────────────────────────────
async function fetchInfirmierStats(userId: string | number): Promise<DashboardStatsResponse> {
  const iid = String(userId);

  const [administrations, surveillances, presences] = await Promise.all([
    safeGet<any[]>(ADMINISTRATIONS.BY_INFIRMIER(iid), []),
    safeGet<any[]>(SURVEILLANCES.BY_INFIRMIER(iid), []),
    safeGet<any[]>(PRESENCES.AUJOURDHUI, []),
  ]);

  const soinsAFaire   = administrations.filter((a: any) => (a.statut ?? '').toUpperCase() !== 'FAIT').length;
  const soinsFaits    = administrations.filter((a: any) => (a.statut ?? '').toUpperCase() === 'FAIT').length;
  const alertes       = surveillances.filter((s: any) => s.alerte === true || s.niveauAlerte === 'CRITIQUE').length;
  const presentsCount = presences.filter((p: any) => p.present === true || p.statut === 'PRESENT').length;

  const kpis: KPIStat[] = [
    { label: 'Soins à faire',   value: soinsAFaire,    icon: 'soins',     color: '#dc2626' },
    { label: 'Soins effectués', value: soinsFaits,     icon: 'soins',     color: '#16a34a' },
    { label: 'Patients suivis', value: surveillances.length, icon: 'patients', color: '#2d9cdb' },
    { label: 'Alertes',         value: alertes,        icon: 'alertes',   color: '#d97706' },
    { label: 'Présents auj.',   value: presentsCount,  icon: 'presences', color: '#26658c' },
  ];

  const soinsByType     = toBarPoints(groupCount(administrations, 'type'));
  const patientStatus   = toPiePoints(
    groupCount(administrations.filter((a: any) => a.statut), 'statut'),
  ).filter((p) => p.value > 0);
  const soinsEvolution  = weeklyTrend(administrations, 'dateAdministration');

  return { kpis, soinsByType, patientConditions: patientStatus, soinsEvolution };
}

// ── Secrétaire ────────────────────────────────────────────────────────────────
async function fetchSecretaireStats(cliniqueId: string | number): Promise<DashboardStatsResponse> {
  const cid = String(cliniqueId);

  const [patients, rdvs, hospitalisations] = await Promise.all([
    safeGet<any[]>(PATIENTS.BY_CLINIQUE(cid), []),
    safeGet<any[]>(RDV.BY_CLINIQUE(cid), []),
    safeGet<any[]>(HOSPITALISATIONS.EN_COURS, []),
  ]);

  const rdvAujourdhui = rdvs.filter((r: any) => {
    const d = r.dateHeure ? new Date(r.dateHeure) : null;
    return d && d.toDateString() === new Date().toDateString();
  }).length;

  const kpis: KPIStat[] = [
    { label: 'Patients enregistrés', value: patients.length,      icon: 'patients',  color: '#2d9cdb' },
    { label: 'RDV total',            value: rdvs.length,          icon: 'rendez',    color: '#26658c' },
    { label: "RDV aujourd'hui",      value: rdvAujourdhui,        icon: 'rendez',    color: '#4ecdc4' },
    { label: 'Hospitalisations',     value: hospitalisations.length, icon: 'patients', color: '#d97706' },
  ];

  const patientFlow       = toBarPoints(groupCount(rdvs, 'statut'));
  const appointmentsByHour = (() => {
    const hours: Record<string, number> = {};
    for (const r of rdvs) {
      const d = r.dateHeure ? new Date(r.dateHeure) : null;
      if (!d) continue;
      const h = `${d.getHours()}h`;
      hours[h] = (hours[h] ?? 0) + 1;
    }
    return toBarPoints(hours);
  })();
  const admissionsEvolution = weeklyTrend(hospitalisations, 'dateAdmission');
  const patientsByStatus    = toPiePoints(groupCount(patients, 'statut')).filter((p) => p.value > 0);

  return { kpis, patientFlow, appointmentsByHour, admissionsEvolution, patientsByStatus };
}

// ── Pharmacien ────────────────────────────────────────────────────────────────
async function fetchPharmacienStats(cliniqueId: string | number): Promise<DashboardStatsResponse> {
  const cid = String(cliniqueId);

  const [stocks, stocksBas, demandes] = await Promise.all([
    safeGet<any[]>(STOCKS.BY_CLINIQUE(cid), []),
    safeGet<any[]>(STOCKS.BAS, []),
    safeGet<any[]>(DEMANDES_MEDICAMENT.EN_ATTENTE, []),
  ]);

  const kpis: KPIStat[] = [
    { label: 'Médicaments',      value: stocks.length,    icon: 'stock',      color: '#2d9cdb' },
    { label: 'Stock critique',   value: stocksBas.length, icon: 'alertes',    color: '#dc2626', trend: stocksBas.length > 0 ? -100 : 0 },
    { label: 'Demandes',         value: demandes.length,  icon: 'ordonnances', color: '#d97706' },
  ];

  const stockAlerts: PieChartPoint[] = stocks.length > 0
    ? [
        { label: 'Normal',   value: stocks.length - stocksBas.length, color: '#16a34a', text: `${stocks.length - stocksBas.length}` },
        { label: 'Critique', value: stocksBas.length,                 color: '#dc2626', text: `${stocksBas.length}` },
      ].filter((p) => p.value > 0)
    : [];

  const medicineConsumption = toBarPoints(groupCount(stocks, 'categorie')).slice(0, 8);

  return { kpis, stockAlerts, medicineConsumption };
}

// ── Radiologue ────────────────────────────────────────────────────────────────
async function fetchRadiologueStats(userId: string | number): Promise<DashboardStatsResponse> {
  const [enAttente, workspace] = await Promise.all([
    safeGet<any[]>(IMAGERIES.EN_ATTENTE, []),
    safeGet<any>(RADIOLOGUE_WORKSPACE.STATS, {}),
  ]);

  const total      = workspace?.totalExamens       ?? enAttente.length;
  const termines   = workspace?.examensTermines     ?? 0;
  const enCours    = workspace?.examensEnCours      ?? 0;
  const rapports   = workspace?.totalRapports       ?? 0;

  const kpis: KPIStat[] = [
    { label: 'Examens en attente', value: enAttente.length, icon: 'examens',  color: '#dc2626' },
    { label: 'Examens terminés',   value: termines,          icon: 'examens',  color: '#16a34a' },
    { label: 'En cours',           value: enCours,           icon: 'examens',  color: '#d97706' },
    { label: 'Rapports',           value: rapports,          icon: 'examens',  color: '#2d9cdb' },
  ].filter((k) => k.value !== undefined);

  const examensByType = toBarPoints(groupCount(enAttente, 'typeExamen')).filter((p) => p.value > 0);

  const reportStatus: PieChartPoint[] = [
    { label: 'En attente', value: enAttente.length, color: '#d97706', text: `${enAttente.length}` },
    { label: 'Terminés',   value: termines,          color: '#16a34a', text: `${termines}` },
    { label: 'En cours',   value: enCours,           color: '#2d9cdb', text: `${enCours}` },
  ].filter((p) => p.value > 0);

  return { kpis, examensByType, reportStatus };
}

// ── Chef Personnel ────────────────────────────────────────────────────────────
async function fetchChefPersonnelStats(): Promise<DashboardStatsResponse> {
  const [presences, absences, absencesJour, conges] = await Promise.all([
    safeGet<any[]>(PRESENCES.AUJOURDHUI, []),
    safeGet<any[]>(PRESENCES.ABSENCES_JOUR, []),
    safeGet<any[]>(PRESENCES.ABSENCES_JOUR, []),
    safeGet<any[]>(CONGES_MEDECIN.DISPONIBLES, []),
  ]);

  const presents  = presences.filter((p: any) => p.present === true || p.statut === 'PRESENT').length;
  const absents   = absences.length;
  const retards   = presences.filter((p: any) => p.statut === 'RETARD').length;

  const kpis: KPIStat[] = [
    { label: "Présents auj.",  value: presents, icon: 'presences', color: '#16a34a' },
    { label: 'Absents auj.',   value: absents,  icon: 'conges',    color: '#dc2626' },
    { label: 'Retards',        value: retards,  icon: 'presences', color: '#d97706' },
    { label: 'Congés dispon.', value: conges.length, icon: 'conges', color: '#2d9cdb' },
  ];

  const workloadByRole = toPiePoints(groupCount(presences, 'role')).filter((p) => p.value > 0);
  const congesByDepartment = toBarPoints(groupCount(conges, 'departement')).filter((p) => p.value > 0);
  const presenceEvolution  = weeklyTrend(presences, 'date');

  return { kpis, workloadByRole, congesByDepartment, presenceEvolution };
}

// ── Technicien ────────────────────────────────────────────────────────────────
async function fetchTechnicienStats(userId: string | number): Promise<DashboardStatsResponse> {
  const tid = String(userId);

  const [equipements, enPanne, maintenances] = await Promise.all([
    safeGet<any[]>(TECHNICIEN_MAINTENANCE.EQUIPEMENTS, []),
    safeGet<any[]>(TECHNICIEN_MAINTENANCE.EQUIPEMENTS_EN_PANNE, []),
    safeGet<any[]>(MAINTENANCES.BY_TECHNICIEN(tid), []),
  ]);

  const fonctionnels = equipements.length - enPanne.length;
  const mainPlanifiees = maintenances.filter((m: any) =>
    (m.statut ?? '').toUpperCase() === 'PLANIFIEE',
  ).length;

  const kpis: KPIStat[] = [
    { label: 'Équipements',   value: equipements.length, icon: 'equipements', color: '#2d9cdb' },
    { label: 'Fonctionnels',  value: Math.max(fonctionnels, 0), icon: 'equipements', color: '#16a34a' },
    { label: 'En panne',      value: enPanne.length,     icon: 'pannes',      color: '#dc2626' },
    { label: 'Maintenances',  value: maintenances.length, icon: 'equipements', color: '#d97706' },
    { label: 'Planifiées',    value: mainPlanifiees,     icon: 'equipements', color: '#7c3aed' },
  ];

  const equipmentStatus: PieChartPoint[] = [
    { label: 'Fonctionnel', value: Math.max(fonctionnels, 0), color: '#16a34a', text: `${Math.max(fonctionnels, 0)}` },
    { label: 'En panne',    value: enPanne.length,             color: '#dc2626', text: `${enPanne.length}` },
  ].filter((p) => p.value > 0);

  const pannesByType         = toBarPoints(groupCount(enPanne, 'categorie')).filter((p) => p.value > 0);
  const maintenanceEvolution = weeklyTrend(maintenances, 'datePlanifiee');

  return { kpis, equipmentStatus, pannesByType, maintenanceEvolution };
}

// ── Patient ───────────────────────────────────────────────────────────────────
async function fetchPatientStats(userId: string | number): Promise<DashboardStatsResponse> {
  const pid = String(userId);

  const [rdvs, ordonnances, constantes] = await Promise.all([
    safeGet<any[]>(RDV.BY_PATIENT(pid), []),
    safeGet<any[]>(`${ORDONNANCES.LIST}?patientId=${pid}`, []),
    safeGet<any[]>(CONSTANTES.HISTORIQUE(pid), []),
  ]);

  const rdvAVenir = rdvs.filter((r: any) => new Date(r.dateHeure ?? 0) > new Date()).length;
  const ordActives = ordonnances.filter((o: any) =>
    (o.statut ?? '').toUpperCase() !== 'TERMINEE',
  ).length;

  const kpis: KPIStat[] = [
    { label: 'RDV à venir',      value: rdvAVenir,          icon: 'rendez',       color: '#2d9cdb' },
    { label: 'Ordonnances act.', value: ordActives,         icon: 'ordonnances',  color: '#26658c' },
    { label: 'Constantes',       value: constantes.length,  icon: 'consultations', color: '#4ecdc4' },
  ];

  const glycemiaEvolution: LineChartPoint[] = constantes
    .filter((c: any) => c.glycemie != null)
    .slice(-12)
    .map((c: any, i: number) => ({ value: Number(c.glycemie), label: `M${i + 1}` }));

  const tensionEvolution: LineChartPoint[] = constantes
    .filter((c: any) => c.taSystolique != null)
    .slice(-12)
    .map((c: any, i: number) => ({ value: Number(c.taSystolique), label: `M${i + 1}` }));

  const appointmentsHistory: BarChartPoint[] = toBarPoints(
    groupCount(rdvs, 'statut'),
  ).filter((p) => p.value > 0);

  return { kpis, glycemiaEvolution, tensionEvolution, appointmentsHistory };
}

// ── Dispatcher principal ──────────────────────────────────────────────────────

export async function fetchDashboardStats(
  role:      DashboardRole,
  cliniqueId?: string | number | null,
  userId?:   string | number | null,
): Promise<DashboardStatsResponse> {
  switch (role) {
    case 'superadmin':
      return fetchSuperAdminStats();

    case 'admin':
      if (!cliniqueId) return { kpis: [] };
      return fetchAdminStats(cliniqueId);

    case 'medecin':
      if (!userId) return { kpis: [] };
      return fetchMedecinStats(userId, cliniqueId);

    case 'infirmier':
      if (!userId) return { kpis: [] };
      return fetchInfirmierStats(userId);

    case 'secretaire':
      if (!cliniqueId) return { kpis: [] };
      return fetchSecretaireStats(cliniqueId);

    case 'pharmacien':
      if (!cliniqueId) return { kpis: [] };
      return fetchPharmacienStats(cliniqueId);

    case 'radiologue':
      if (!userId) return { kpis: [] };
      return fetchRadiologueStats(userId);

    case 'chef-personnel':
      return fetchChefPersonnelStats();

    case 'technicien':
      if (!userId) return { kpis: [] };
      return fetchTechnicienStats(userId);

    case 'patient':
      if (!userId) return { kpis: [] };
      return fetchPatientStats(userId);

    default:
      return { kpis: [] };
  }
}

