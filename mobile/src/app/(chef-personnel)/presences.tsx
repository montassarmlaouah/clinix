import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { chefPersonnelService, type Presence } from '@/src/api/services/chef-personnel.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function ChefPresencesScreen(): React.JSX.Element {
  const [liste, setListe] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await chefPersonnelService.presencesAujourdhui();
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Présences du jour</Text>
      </View>
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.infirmier?.prenom} {item.infirmier?.nom}
            </Text>
            <Text style={styles.meta}>
              Arrivée : {item.heureArrivee ? new Date(item.heureArrivee).toLocaleTimeString('fr-FR') : '—'}
            </Text>
            <Text style={styles.meta}>Statut : {item.statut ?? '—'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="time-outline" title="Aucune présence" subtitle="Aucun enregistrement aujourd'hui." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: { padding: spacing.xxl, backgroundColor: LUNA_COLORS.surface },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  list: { padding: spacing.xxl, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
