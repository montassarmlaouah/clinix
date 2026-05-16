import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { pharmacieService, type Stock } from '@/src/api/services/pharmacie.service';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function PharmacienAlertesScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [alertes, setAlertes] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await pharmacieService.listStocksBas(cliniqueId);
      setAlertes(data ?? []);
    } catch {
      setAlertes([]);
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
      <LunaHeroHeader title="Alertes stock" subtitle={`${alertes.length} alerte(s) active(s)`} />
      <FlatList
        data={alertes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
        }
        renderItem={({ item }) => (
          <ListCard
            title={item.medicament?.nom ?? 'Médicament'}
            subtitle={`Quantité : ${item.quantite} / seuil ${item.seuilAlerte}`}
            meta={`Lot ${item.lot}${item.dateExpiration ? ` · Exp. ${item.dateExpiration}` : ''}`}
            accentColor={LUNA_COLORS.warning}
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle-outline" title="RAS" subtitle="Aucun stock en alerte." />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 100 },
});
