import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { medecinService } from '@/src/api/services/medecinService';
import { LunaStatCard } from '@/src/components/common/LunaStatCard';
import { LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontWeight, typography } from '@/src/theme/typography';

export function MedecinStatistiquesScreen(): React.JSX.Element {
  const medecinId = useAuthStore((s) => s.userId);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await medecinService.getWorkspaceStats(medecinId);
      setStats(data ?? {});
    } catch {
      setStats({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => {
    void load();
  }, [load]);

  const num = (k: string) => {
    const v = stats[k];
    return v != null ? String(v) : '—';
  };

  const entries = Object.entries(stats).filter(([, v]) => typeof v === 'number' || typeof v === 'string');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Statistiques" subtitle="Activité médicale" />
      {loading ? <LoadingOverlay /> : null}
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
      >
        <View style={styles.row}>
          <LunaStatCard label="Patients" value={num('patientsTotal')} icon="people-outline" />
          <LunaStatCard label="Consultations" value={num('consultationsTotal')} icon="document-text-outline" />
        </View>
        <View style={styles.row}>
          <LunaStatCard label="RDV aujourd'hui" value={num('rendezVousAujourdhui')} icon="calendar-outline" />
          <LunaStatCard label="Hospitalisés" value={num('patientsHospitalises')} icon="bed-outline" />
        </View>
        {entries.length > 4 ? (
          <View style={styles.extra}>
            <Text style={styles.extraTitle}>Détail API</Text>
            {entries.map(([k, v]) => (
              <View key={k} style={styles.extraRow}>
                <Text style={styles.extraKey}>{k}</Text>
                <Text style={styles.extraVal}>{String(v)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md }, // ✨ espace tab bar
  row: { flexDirection: 'row', gap: spacing.md },
  extra: {
    marginTop: spacing.lg,
    backgroundColor: LUNA_COLORS.surface, // ✨ carte surface
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    ...(shadows.sm as object),
  },
  extraTitle: { ...typography.sectionTitle, marginBottom: spacing.sm }, // ✨ titre section
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  extraKey: { color: LUNA_COLORS.textSecondary, flex: 1 },
  extraVal: { fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
});
