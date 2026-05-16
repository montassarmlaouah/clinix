import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { chefPersonnelService, type Planning } from '@/src/api/services/chef-personnel.service';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function ChefPlanningScreen(): React.JSX.Element {
  const [liste, setListe] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await chefPersonnelService.listPlannings();
      setListe(data ?? []);
    } catch {
      setListe([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Plannings infirmiers" subtitle={`${liste.length} planning(s)`} />
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
        renderItem={({ item }) => (
          <ListCard
            title={item.type ?? 'Planning'}
            subtitle={`${item.dateDebut ? new Date(item.dateDebut).toLocaleDateString('fr-FR') : '—'} → ${item.dateFin ? new Date(item.dateFin).toLocaleDateString('fr-FR') : '—'}`}
            meta={item.valide ? 'Validé' : 'En attente de validation'}
            accentColor={item.valide ? LUNA_COLORS.success : LUNA_COLORS.warning}
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Aucun planning" subtitle="Les plannings apparaîtront ici." />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
});
