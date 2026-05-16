import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { apiGet } from '@/src/api/client';
import { PRESENCES } from '@/src/api/endpoints';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Presence {
  id: string | number;
  date?: string;
  statut?: string;
  heureArrivee?: string;
  heureDepart?: string;
}

export function InfirmierPresencesScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet<Presence[]>(PRESENCES.BY_INFIRMIER(userId));
      setListe(data ?? []);
    } catch {
      try {
        const today = await apiGet<Presence[]>(PRESENCES.AUJOURDHUI);
        setListe(today ?? []);
      } catch {
        setListe([]);
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
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Mes présences" subtitle="Historique de pointage" />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={liste}
        keyExtractor={(item, i) => String(item.id ?? i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="time-outline" title="Aucune présence" subtitle="Vos pointages apparaîtront ici." />
          ) : null
        }
        renderItem={({ item }) => (
          <ListCard
            title={item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'Présence'}
            subtitle={
              item.heureArrivee
                ? `Arrivée ${new Date(item.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : undefined
            }
            meta={item.statut ?? (item.heureDepart ? 'Départ enregistré' : '—')}
            accentColor={item.statut === 'ABSENT' ? LUNA_COLORS.error : LUNA_COLORS.success}
          />
        )}
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
});
