import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { pharmacieService } from '@/src/api/services/pharmacie.service';
import { DashboardQuickLinks, LunaHeroHeader, LunaScreen, LunaStatCard } from '@/src/components/common';
import { LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

export function PharmacienDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const { prenom, nom } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ medicaments: 0, stocks: 0, alertes: 0, demandes: 0 });

  const load = useCallback(async () => {
    try {
      const [meds, stk, bas, dem] = await Promise.all([
        pharmacieService.listMedicaments(),
        pharmacieService.listStocks(cliniqueId),
        pharmacieService.listStocksBas(cliniqueId),
        pharmacieService.listDemandesEnAttente(cliniqueId),
      ]);
      setStats({
        medicaments: meds?.length ?? 0,
        stocks: stk?.length ?? 0,
        alertes: bas?.length ?? 0,
        demandes: dem?.length ?? 0,
      });
    } catch {
      setStats({ medicaments: 0, stocks: 0, alertes: 0, demandes: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Pharmacie"
        subtitle={`${prenom ?? ''} ${nom ?? ''}`.trim() || 'Espace pharmacien'}
      />
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
          <Pressable style={styles.kpi} onPress={() => router.push('/(pharmacien)/demandes' as never)}>
            <LunaStatCard label="Demandes" value={stats.demandes} icon="clipboard-outline" color={LUNA_COLORS.accentGold} />
          </Pressable>
          <Pressable style={styles.kpi} onPress={() => router.push('/(pharmacien)/alertes' as never)}>
            <LunaStatCard label="Alertes stock" value={stats.alertes} icon="warning-outline" color={LUNA_COLORS.warning} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <Pressable style={styles.kpi} onPress={() => router.push('/(pharmacien)/stock' as never)}>
            <LunaStatCard label="Stocks" value={stats.stocks} icon="medkit-outline" />
          </Pressable>
          <Pressable style={styles.kpi} onPress={() => router.push('/(pharmacien)/pharmacie' as never)}>
            <LunaStatCard label="Médicaments" value={stats.medicaments} icon="grid-outline" />
          </Pressable>
        </View>

        <Text style={styles.section}>Actions rapides</Text>
        <View style={styles.actions}>
          <ActionTile label="Traiter demandes" icon="clipboard-outline" onPress={() => router.push('/(pharmacien)/demandes' as never)} />
          <ActionTile label="Interface complète" icon="grid-outline" onPress={() => router.push('/(pharmacien)/pharmacie' as never)} />
          <ActionTile label="Stocks bas" icon="warning-outline" onPress={() => router.push('/(pharmacien)/alertes' as never)} />
        </View>

        <DashboardQuickLinks maxItems={6} accentColor={LUNA_COLORS.accentGold} />
      </ScrollView>
    </LunaScreen>
  );
}

function ActionTile({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={22} color={LUNA_COLORS.accentGold} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
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
    borderLeftColor: LUNA_COLORS.accentGold,
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
