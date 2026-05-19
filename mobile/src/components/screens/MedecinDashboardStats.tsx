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

const { width: W } = Dimensions.get('window');
const CHART_W = W - 80;

export function MedecinDashboardStats(): React.JSX.Element {
  const { nom, cliniqueId, userId } = useAuthStore();
  const { data, loading, error, refetch } = useDashboardStats('medecin', cliniqueId, userId);

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <LunaScreen>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Impossible de charger les données</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      </LunaScreen>
    );
  }

  const consultEvol   = data.consultationsEvolution  ?? [];
  const consultComp   = data.consultationsComparison ?? [];
  const patStatus     = data.patientsByStatus        ?? [];
  const patService    = data.patientsByService       ?? [];
  const alerts        = data.alertsByType            ?? [];

  return (
    <LunaScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} colors={[LUNA_COLORS.secondary]} />}
        contentContainerStyle={styles.scroll}
      >
        <LunaHeroHeader
          title={`Dr ${nom ?? 'Médecin'}`}
          subtitle="Tableau de bord médical · Temps réel"
          icon="medical"
        />

        {/* ── KPIs ── */}
        <StatRow stats={data.kpis} />

        {/* ── Courbe consultations ── */}
        {consultEvol.length > 0 && (
          <ChartCard
            title="Évolution des consultations"
            subtitle="8 dernières semaines"
            badge="Live"
          >
            <LineChart
              areaChart
              data={consultEvol}
              data2={consultComp.length > 0 ? consultComp : undefined}
              width={CHART_W}
              height={180}
              color1={CHART_COLORS.primary}
              color2={CHART_COLORS.tertiary}
              startFillColor1={CHART_COLORS.primary}
              startFillColor2={CHART_COLORS.tertiary}
              endFillColor1="transparent"
              endFillColor2="transparent"
              startOpacity1={0.25}
              startOpacity2={0.15}
              curved
              thickness={2.5}
              rulesColor={CHART_COLORS.gridLines}
              yAxisColor="transparent"
              xAxisColor="rgba(38,101,140,0.15)"
              xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              noOfSections={4}
              dataPointsColor1={CHART_COLORS.primary}
              dataPointsColor2={CHART_COLORS.tertiary}
            />
            {consultComp.length > 0 && (
              <View style={styles.legendRow}>
                <LegendItem color={CHART_COLORS.primary}   label="Cette période" />
                <LegendItem color={CHART_COLORS.tertiary}  label="Période précédente" />
              </View>
            )}
          </ChartCard>
        )}

        {/* ── Patients par service ── */}
        {patService.length > 0 && (
          <ChartCard title="Patients par service" subtitle="Répartition actuelle">
            <BarChart
              data={patService.map((d, i) => ({ ...d, frontColor: d.frontColor ?? CHART_PALETTE[i % CHART_PALETTE.length] }))}
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
        )}

        {/* ── Donut statut patients ── */}
        {patStatus.length > 0 && (
          <ChartCard title="Statut des patients" subtitle="Distribution temps réel">
            <View style={styles.pieRow}>
              <PieChart
                data={patStatus}
                donut
                radius={70}
                innerRadius={44}
                showText
                textSize={11}
                textColor={LUNA_COLORS.textPrimary}
                innerCircleColor={LUNA_COLORS.surface}
              />
              <View style={styles.pieLegend}>
                {patStatus.map((s, i) => (
                  <LegendItem key={i} color={s.color} label={s.label ?? s.text ?? `Segment ${i + 1}`} value={s.value} />
                ))}
              </View>
            </View>
          </ChartCard>
        )}

        {/* ── Alertes par type ── */}
        {alerts.length > 0 && (
          <ChartCard title="Alertes par type" subtitle="Dernières 24 h">
            <BarChart
              data={alerts.map((d, i) => ({ ...d, frontColor: d.frontColor ?? CHART_PALETTE[i % CHART_PALETTE.length] }))}
              width={CHART_W}
              height={140}
              barWidth={28}
              spacing={16}
              borderRadius={6}
              noOfSections={3}
              rulesColor={CHART_COLORS.gridLines}
              yAxisColor="transparent"
              xAxisColor="rgba(38,101,140,0.15)"
              xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 10 }}
              yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              showValuesAsTopLabel
              topLabelTextStyle={{ fontSize: 10, fontWeight: '600', color: LUNA_COLORS.textPrimary }}
            />
          </ChartCard>
        )}
      </ScrollView>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.huge,
  },
  centered: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.xxl,
    gap:            spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textSecondary,
    marginTop: spacing.sm,
  },
  errorTitle: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textPrimary,
    textAlign:  'center',
  },
  errorMsg: {
    fontSize:  fontSize.sm,
    color:     LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.xxl,
    borderRadius:      borderRadius.full,
    marginTop:         spacing.sm,
  },
  retryText: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
    fontSize:   fontSize.base,
  },
  legendRow: {
    flexDirection: 'row',
    gap:           spacing.xl,
    marginTop:     spacing.sm,
    paddingLeft:   spacing.sm,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xl,
  },
  pieLegend: {
    flex: 1,
  },
});
