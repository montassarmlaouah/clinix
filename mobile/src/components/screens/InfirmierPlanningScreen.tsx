import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { GARDES } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Garde {
  id: string | number;
  debut?: string;
  fin?: string;
  type?: string;
  infirmiers?: Array<{ nom?: string; prenom?: string }>;
}

const TYPE_COLOR: Record<string, string> = {
  JOUR: '#3b82f6',
  NUIT: '#7c3aed',
  MATIN: '#10b981',
  APRES_MIDI: '#f59e0b',
};

function formatDateTime(val: string | undefined): string {
  if (!val) return '\u2014';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function InfirmierPlanningScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [gardes, setGardes] = useState<Garde[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet<Garde[]>(GARDES.BY_UTILISATEUR(userId));
      setGardes(data ?? []);
    } catch {
      setGardes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Mon planning" subtitle="Gardes et creneaux" />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={gardes}
        keyExtractor={(item, i) => String(item.id ?? i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="calendar-outline" title="Aucun creneau planifie" /> : null
        }
        renderItem={({ item }) => {
          const typeColor = TYPE_COLOR[item.type ?? ''] ?? LUNA_COLORS.textSecondary;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDateTime(item.debut)}</Text>
                {item.type ? (
                  <View style={[styles.badge, { backgroundColor: typeColor }]}>
                    <Text style={styles.badgeText}>{item.type}</Text>
                  </View>
                ) : null}
              </View>
              {item.fin ? (
                <Text style={styles.meta}>{"Jusqu'a"} {formatDateTime(item.fin)}</Text>
              ) : null}
              {item.infirmiers && item.infirmiers.length > 0 ? (
                <Text style={styles.meta}>
                  {'Infirmiers : '}{item.infirmiers.map((inf) => (inf.prenom ?? '') + ' ' + (inf.nom ?? '')).join(', ')}
                </Text>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardDate: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.text },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, color: '#fff', fontWeight: fontWeight.bold },
});