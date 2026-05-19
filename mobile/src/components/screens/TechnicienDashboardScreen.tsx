import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { technicienService } from '@/src/api/services/technicien.service';
import { DashboardQuickLinks, LunaHeroHeader, LunaScreen, LunaStatCard, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

export function TechnicienDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const { prenom, nom } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [pannes, setPannes] = useState(0);

  const load = useCallback(async () => {
    try {
      const [all, enPanne] = await Promise.all([
        technicienService.listEquipements(),
        technicienService.listEnPanne(),
      ]);
      setTotal(all?.length ?? 0);
      setPannes(enPanne?.length ?? 0);
    } catch {
      setTotal(0);
      setPannes(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  const ok = Math.max(0, total - pannes);

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Maintenance" subtitle={`${prenom ?? ''} ${nom ?? ''}`.trim() || 'Technicien'} />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
      >
        <View style={styles.row}>
          <Pressable style={styles.kpi} onPress={() => router.push('/(technicien)/equipements' as never)}>
            <LunaStatCard label="Équipements" value={total} icon="construct-outline" color={LUNA_COLORS.warning} />
          </Pressable>
          <Pressable style={styles.kpi} onPress={() => router.push('/(technicien)/pannes' as never)}>
            <LunaStatCard label="En panne" value={pannes} icon="warning-outline" color={LUNA_COLORS.error} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <LunaStatCard label="Opérationnels" value={ok} icon="checkmark-circle-outline" color={LUNA_COLORS.success} />
        </View>

        <Text style={styles.section}>Actions rapides</Text>
        <View style={styles.actions}>
          <Pressable style={styles.tile} onPress={() => router.push('/(technicien)/pannes' as never)}>
            <View style={styles.tileIcon}>
              <Ionicons name="warning-outline" size={22} color={LUNA_COLORS.warning} />
            </View>
            <Text style={styles.tileLabel}>Traiter les pannes</Text>
          </Pressable>
          <Pressable style={styles.tile} onPress={() => router.push('/(technicien)/chambres' as never)}>
            <View style={styles.tileIcon}>
              <Ionicons name="bed-outline" size={22} color={LUNA_COLORS.secondary} />
            </View>
            <Text style={styles.tileLabel}>Chambres & équipements</Text>
          </Pressable>
        </View>

        <DashboardQuickLinks maxItems={5} accentColor={LUNA_COLORS.warning} />
      </ScrollView>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: 80 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  kpi: { flex: 1 },
  section: {
    ...typography.sectionTitle,
    marginVertical: spacing.md,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  tile: {
    width: '47%',
    backgroundColor: LUNA_COLORS.surfaceLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.warning,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary },
});
