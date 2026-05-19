/**
 * Composant générique de dashboard statistiques.
 * Utilisé par tous les rôles n'ayant pas de personnalisation spécifique des charts.
 * Les données viennent de /api/dashboard/{role}/stats
 */
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import { ChartCard, LegendItem, LunaHeroHeader, LunaScreen, StatRow } from '@/src/components/common';
import { CHART_COLORS, CHART_PALETTE } from '@/src/constants/chartColors';
import { useDashboardStats } from '@/src/hooks/useDashboardStats';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import type { DashboardRole } from '@/src/types/dashboard.types';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 80;

interface GenericDashboardStatsProps {
  role:       DashboardRole;
  title:      string;
  subtitle?:  string;
  icon?:      string;
}

export function GenericDashboardStats({
  role,
  title,
  subtitle = 'Statistiques · Temps réel',
  icon = 'stats-chart',
}: GenericDashboardStatsProps): React.JSX.Element {
  const { cliniqueId, userId } = useAuthStore();
  const { data, loading, error, refetch } = useDashboardStats(role, cliniqueId, userId);

  if (loading) {
    return (
      <LunaScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
          <Text style={styles.loadingText}>Chargement des statistiques…</Text>
        </View>
      </LunaScreen>
    );
  }

  if (error || !data) {
    return (
      <LunaScreen>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMsg}>{error ?? 'Données indisponibles'}</Text>
          <Pressable style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      </LunaScreen>
    );
  }

  // Toutes les clés optionnelles de DashboardStatsResponse — utiliser ce qui existe
  const lineCharts: Array<{ key: keyof typeof data; label: string; subtitle: string; color: string }> = [
    { key: 'consultationsEvolution',  label: 'Consultations',        subtitle: 'Évolution 8 semaines',  color: CHART_COLORS.primary },
    { key: 'occupancyEvolution',      label: "Taux d'occupation",    subtitle: '30 derniers jours',      color: CHART_COLORS.secondary },
    { key: 'cliniquesGrowth',         label: 'Croissance cliniques', subtitle: 'Évolution annuelle',     color: CHART_COLORS.tertiary },
    { key: 'soinsEvolution',          label: 'Soins réalisés',       subtitle: 'Par semaine',            color: CHART_COLORS.success },
    { key: 'ordonnancesEvolution',    label: 'Ordonnances',          subtitle: 'Évolution mensuelle',    color: CHART_COLORS.purple },
    { key: 'examensEvolution',        label: 'Examens réalisés',     subtitle: 'Évolution mensuelle',    color: CHART_COLORS.warning },
    { key: 'admissionsEvolution',     label: 'Admissions',           subtitle: 'Évolution mensuelle',    color: CHART_COLORS.primary },
    { key: 'presenceEvolution',       label: 'Présences',            subtitle: 'Par semaine',            color: CHART_COLORS.success },
    { key: 'maintenanceEvolution',    label: 'Maintenances',         subtitle: 'Évolution mensuelle',    color: CHART_COLORS.warning },
    { key: 'revenueEvolution',        label: 'Revenus',              subtitle: 'Évolution mensuelle',    color: CHART_COLORS.success },
    { key: 'glycemiaEvolution',       label: 'Glycémie',             subtitle: 'Mesures récentes',       color: CHART_COLORS.error },
    { key: 'tensionEvolution',        label: 'Tension artérielle',   subtitle: 'Mesures récentes',       color: CHART_COLORS.secondary },
    { key: 'appointmentsEvolution',   label: 'Rendez-vous',          subtitle: 'Évolution mensuelle',    color: CHART_COLORS.tertiary },
  ];

  const barCharts: Array<{ key: keyof typeof data; label: string; subtitle: string }> = [
    { key: 'patientsByService',       label: 'Patients par service',      subtitle: 'Répartition actuelle' },
    { key: 'personnelByRole',         label: 'Personnel par rôle',        subtitle: 'Effectifs actuels' },
    { key: 'soinsByType',             label: 'Soins par type',            subtitle: 'Dernières 24 h' },
    { key: 'medicineConsumption',     label: 'Consommation médicaments',  subtitle: 'Top médicaments' },
    { key: 'examensByType',           label: 'Examens par type',          subtitle: 'Répartition actuelle' },
    { key: 'appointmentsByHour',      label: 'RDV par heure',             subtitle: "Distribution sur la journée" },
    { key: 'congesByDepartment',      label: 'Congés par département',    subtitle: 'En cours' },
    { key: 'pannesByType',            label: 'Pannes par type',           subtitle: 'Dernières signalées' },
    { key: 'subscriptionsStats',      label: 'Abonnements',               subtitle: 'Répartition par plan' },
    { key: 'alertsByType',            label: 'Alertes par type',          subtitle: 'Dernières 24 h' },
    { key: 'patientFlow',             label: 'Flux patients',             subtitle: 'Par heure' },
    { key: 'appointmentsHistory',     label: 'Historique RDV',            subtitle: 'Derniers mois' },
  ];

  const pieCharts: Array<{ key: keyof typeof data; label: string; subtitle: string }> = [
    { key: 'patientsByStatus',        label: 'Statut patients',           subtitle: 'Distribution temps réel' },
    { key: 'serviceOccupancy',        label: 'Occupation services',       subtitle: 'Chambres occupées / libres' },
    { key: 'subscriptionsByPlan',     label: 'Abonnements par plan',      subtitle: 'Répartition actuelle' },
    { key: 'patientConditions',       label: 'État des patients',         subtitle: 'Répartition par condition' },
    { key: 'stockAlerts',             label: 'Alertes stock',             subtitle: 'Stock critique / normal' },
    { key: 'reportStatus',            label: 'Statut rapports',           subtitle: 'Lus / en attente' },
    { key: 'workloadByRole',          label: 'Charge par rôle',           subtitle: 'Répartition actuelle' },
    { key: 'equipmentStatus',         label: 'État équipements',          subtitle: 'Fonctionnel / en panne' },
  ];

  return (
    <LunaScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} colors={[LUNA_COLORS.secondary]} />}
        contentContainerStyle={styles.scroll}
      >
        <LunaHeroHeader title={title} subtitle={subtitle} icon={icon as any} />

        {/* KPIs */}
        <StatRow stats={data.kpis} />

        {/* Line charts dynamiques */}
        {lineCharts.map(({ key, label, subtitle: sub, color }) => {
          const series = data[key] as any[] | undefined;
          if (!series || series.length === 0) return null;
          return (
            <ChartCard key={key} title={label} subtitle={sub} badge="Live">
              <LineChart
                areaChart
                data={series}
                width={CHART_W}
                height={170}
                color1={color}
                startFillColor1={color}
                endFillColor1="transparent"
                startOpacity1={0.2}
                curved
                thickness={2.5}
                rulesColor={CHART_COLORS.gridLines}
                yAxisColor="transparent"
                xAxisColor="rgba(38,101,140,0.15)"
                xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
                yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
                noOfSections={4}
                dataPointsColor1={color}
              />
            </ChartCard>
          );
        })}

        {/* Bar charts dynamiques */}
        {barCharts.map(({ key, label, subtitle: sub }) => {
          const series = data[key] as any[] | undefined;
          if (!series || series.length === 0) return null;
          return (
            <ChartCard key={key} title={label} subtitle={sub}>
              <BarChart
                data={series.map((d: any, i: number) => ({
                  ...d,
                  frontColor: d.frontColor ?? CHART_PALETTE[i % CHART_PALETTE.length],
                }))}
                width={CHART_W}
                height={160}
                barWidth={32}
                spacing={14}
                borderRadius={6}
                noOfSections={4}
                rulesColor={CHART_COLORS.gridLines}
                yAxisColor="transparent"
                xAxisColor="rgba(38,101,140,0.15)"
                xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 10 }}
                yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
                showValuesAsTopLabel
                topLabelTextStyle={{ fontSize: 10, fontWeight: '600', color: LUNA_COLORS.textPrimary }}
              />
            </ChartCard>
          );
        })}

        {/* Pie / Donut charts dynamiques */}
        {pieCharts.map(({ key, label, subtitle: sub }) => {
          const series = data[key] as any[] | undefined;
          if (!series || series.length === 0) return null;
          return (
            <ChartCard key={key} title={label} subtitle={sub}>
              <View style={styles.pieRow}>
                <PieChart
                  data={series}
                  donut
                  radius={70}
                  innerRadius={44}
                  showText
                  textSize={11}
                  innerCircleColor={LUNA_COLORS.surface}
                />
                <View style={styles.pieLegend}>
                  {series.map((s: any, i: number) => (
                    <LegendItem
                      key={i}
                      color={s.color}
                      label={s.label ?? s.text ?? `Segment ${i + 1}`}
                      value={s.value}
                    />
                  ))}
                </View>
              </View>
            </ChartCard>
          );
        })}
      </ScrollView>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  scroll:      { paddingBottom: spacing.huge },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  loadingText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.sm },
  errorTitle:  { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary, textAlign: 'center' },
  errorMsg:    { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center' },
  retryBtn:    { backgroundColor: LUNA_COLORS.secondary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.full, marginTop: spacing.sm },
  retryText:   { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  pieRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  pieLegend:   { flex: 1 },
});
