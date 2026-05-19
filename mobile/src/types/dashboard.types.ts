// ── Dashboard Types ─────────────────────────────────────────────────────────

export interface KPIStat {
  label:  string;
  value:  string | number;
  trend?: number;           // % variation (positive = hausse, negative = baisse)
  icon:   string;
  color?: string;
}

export interface LineChartPoint {
  value: number;
  label?: string;
  dataPointText?: string;
}

export interface BarChartPoint {
  value:       number;
  label:       string;
  frontColor?: string;
  topLabelComponent?: () => React.ReactNode;
}

export interface PieChartPoint {
  value:    number;
  color:    string;
  text?:    string;
  label?:   string;
  focused?: boolean;
}

// ── Réponse unifiée par rôle ─────────────────────────────────────────────────
export interface DashboardStatsResponse {
  kpis: KPIStat[];

  // Médecin
  consultationsEvolution?:  LineChartPoint[];
  consultationsComparison?: LineChartPoint[];
  patientsByStatus?:        PieChartPoint[];
  patientsByService?:       BarChartPoint[];
  alertsByType?:            BarChartPoint[];

  // Admin clinique
  occupancyEvolution?:      LineChartPoint[];
  personnelByRole?:         BarChartPoint[];
  serviceOccupancy?:        PieChartPoint[];
  appointmentsEvolution?:   LineChartPoint[];

  // Super admin
  cliniquesGrowth?:         LineChartPoint[];
  subscriptionsByPlan?:     PieChartPoint[];
  revenueEvolution?:        LineChartPoint[];
  subscriptionsStats?:      BarChartPoint[];

  // Infirmier
  soinsEvolution?:          LineChartPoint[];
  soinsByType?:              BarChartPoint[];
  patientConditions?:       PieChartPoint[];

  // Pharmacien
  medicineConsumption?:     BarChartPoint[];
  stockAlerts?:             PieChartPoint[];
  ordonnancesEvolution?:    LineChartPoint[];

  // Radiologue
  examensByType?:           BarChartPoint[];
  examensEvolution?:        LineChartPoint[];
  reportStatus?:            PieChartPoint[];

  // Secrétaire
  appointmentsByHour?:      BarChartPoint[];
  admissionsEvolution?:     LineChartPoint[];
  patientFlow?:             BarChartPoint[];

  // Chef personnel
  presenceEvolution?:       LineChartPoint[];
  congesByDepartment?:      BarChartPoint[];
  workloadByRole?:          PieChartPoint[];

  // Technicien
  equipmentStatus?:         PieChartPoint[];
  maintenanceEvolution?:    LineChartPoint[];
  pannesByType?:            BarChartPoint[];

  // Patient
  glycemiaEvolution?:       LineChartPoint[];
  tensionEvolution?:        LineChartPoint[];
  appointmentsHistory?:     BarChartPoint[];
}

export type DashboardRole =
  | 'superadmin'
  | 'admin'
  | 'medecin'
  | 'infirmier'
  | 'secretaire'
  | 'pharmacien'
  | 'radiologue'
  | 'patient'
  | 'chef-personnel'
  | 'technicien';
