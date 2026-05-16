import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { PLANNINGS } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export function InfirmierPlanningScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet<unknown[]>(PLANNINGS.BY_UTILISATEUR(userId));
      setItems((data as Record<string, unknown>[]) ?? []);
    } catch {
      try {
        const all = await apiGet<unknown[]>(PLANNINGS.LIST);
        const filtered = (all as Record<string, unknown>[]).filter(
          (p) => String(p.infirmierId ?? p.personnelId) === String(userId),
        );
        setItems(filtered);
      } catch {
        setItems([]);
      }
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
      <ScreenHeader title="Mon planning" subtitle="Créneaux et gardes" />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item.id ?? i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="calendar-outline" title="Aucun créneau planifié" /> : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {String(item.date ?? item.dateDebut ?? item.jour ?? 'Planning')}
            </Text>
            <Text style={styles.meta}>
              {[item.heureDebut, item.heureFin].filter(Boolean).join(' — ') ||
                String(item.horaire ?? item.shift ?? '')}
            </Text>
            {item.service ? <Text style={styles.meta}>Service : {String(item.service)}</Text> : null}
          </View>
        )}
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
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.tertiary,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
