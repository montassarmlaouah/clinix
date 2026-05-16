import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { chefPersonnelService } from '@/src/api/services/chef-personnel.service';
import { DashboardQuickLinks, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function ChefPersonnelDashboard(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const { prenom, nom } = useAuthStore();
  const [stats, setStats] = useState({ plannings: 0, conges: 0, presences: 0, services: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [plannings, conges, presences, services] = await Promise.allSettled([
        chefPersonnelService.listPlannings(),
        chefPersonnelService.listAbsencesEnAttente(),
        chefPersonnelService.presencesAujourdhui(),
        cliniqueId ? chefPersonnelService.servicesByClinique(cliniqueId) : Promise.resolve([]),
      ]);
      setStats({
        plannings: plannings.status === 'fulfilled' ? (plannings.value?.length ?? 0) : 0,
        conges: conges.status === 'fulfilled' ? (conges.value?.length ?? 0) : 0,
        presences: presences.status === 'fulfilled' ? (presences.value?.length ?? 0) : 0,
        services: services.status === 'fulfilled' ? (services.value?.length ?? 0) : 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  const name = [prenom, nom].filter(Boolean).join(' ').trim();

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Chef du personnel"
        subtitle={name || 'Tableau de bord'}
        showBack={false}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
      >
        <View style={styles.grid}>
          <Metric label="Plannings" value={stats.plannings} />
          <Metric label="Congés en attente" value={stats.conges} color={LUNA_COLORS.warning} />
          <Metric label="Présences aujourd'hui" value={stats.presences} color={LUNA_COLORS.success} />
          <Metric label="Services actifs" value={stats.services} color={LUNA_COLORS.info} />
        </View>

        <DashboardQuickLinks maxItems={6} />
      </ScrollView>
    </LunaScreen>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 80 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  metric: {
    width: '47%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...(shadows.sm as object),
  },
  metricValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  metricLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
