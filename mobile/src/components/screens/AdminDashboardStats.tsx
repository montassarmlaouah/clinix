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

export function AdminDashboardStats(): React.JSX.Element {
  const { nom, cliniqueId, userId } = useAuthStore();
  const { data, loading, error, refetch } = useDashboardStats('admin', cliniqueId, userId);

  if (loading) {
    return (
      <LunaScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </LunaScreen>
    );
  }

  if (error || !data) {
    return (
      <LunaScreen>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      </LunaScreen>
    );
  }

  const occupancy     = data.occupancyEvolution    ?? [];
  const personnel     = data.personnelByRole       ?? [];
  const serviceOcc    = data.serviceOccupancy      ?? [];
  const appointments  = data.appointmentsEvolution ?? [];

  return (
    <LunaScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} colors={[LUNA_COLORS.secondary]} />}
        contentContainerStyle={styles.scroll}
      >
        <LunaHeroHeader
          title={nom ?? 'Admin Clinique'}
          subtitle="Vue d'ensemble de la clinique"
          icon="business"
        />

        <StatRow stats={data.kpis} />

        {/* Taux d'occupation */}
        {occupancy.length > 0 && (
          <ChartCard title="Taux d'occupation" subtitle="30 derniers jours" badge="Live">
            <LineChart
              areaChart
              data={occupancy}
              width={CHART_W}
              height={180}
              color1={CHART_COLORS.secondary}
              startFillColor1={CHART_COLORS.secondary}
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
              dataPointsColor1={CHART_COLORS.secondary}
            />
          </ChartCard>
        )}

        {/* Personnel par rôle */}
        {personnel.length > 0 && (
          <ChartCard title="Personnel par rôle" subtitle="Effectifs actuels">
            <BarChart
              data={personnel.map((d, i) => ({ ...d, frontColor: d.frontColor ?? CHART_PALETTE[i % CHART_PALETTE.length] }))}
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

        {/* Occupation services — donut */}
        {serviceOcc.length > 0 && (
          <ChartCard title="Occupation par service" subtitle="Chambres occupées / libres">
            <View style={styles.pieRow}>
              <PieChart
                data={serviceOcc}
                donut
                radius={70}
                innerRadius={44}
                showText
                textSize={11}
                innerCircleColor={LUNA_COLORS.surface}
              />
              <View style={styles.pieLegend}>
                {serviceOcc.map((s, i) => (
                  <LegendItem key={i} color={s.color} label={s.label ?? `Service ${i + 1}`} value={s.value} />
                ))}
              </View>
            </View>
          </ChartCard>
        )}

        {/* Rendez-vous */}
        {appointments.length > 0 && (
          <ChartCard title="Rendez-vous" subtitle="Évolution 4 semaines">
            <LineChart
              data={appointments}
              width={CHART_W}
              height={150}
              color1={CHART_COLORS.tertiary}
              curved
              thickness={2}
              rulesColor={CHART_COLORS.gridLines}
              yAxisColor="transparent"
              xAxisColor="rgba(38,101,140,0.15)"
              xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              noOfSections={3}
              dataPointsColor1={CHART_COLORS.tertiary}
            />
          </ChartCard>
        )}
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
