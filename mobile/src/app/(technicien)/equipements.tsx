import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';

import { technicienService, type Equipement } from '@/src/api/services/technicien.service';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function statutColor(statut?: string) {
  if (statut === 'EN_PANNE') return LUNA_COLORS.error;
  if (statut === 'EN_MAINTENANCE') return LUNA_COLORS.warning;
  if (statut === 'DISPONIBLE') return LUNA_COLORS.success;
  return LUNA_COLORS.textSecondary;
}

export default function TechnicienEquipementsScreen(): React.JSX.Element {
  const [liste, setListe] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await technicienService.listEquipements();
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
      <LunaHeroHeader title="Équipements" subtitle={`${liste.length} équipement(s)`} />
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
            title={item.nom}
            subtitle={`Code ${item.code ?? '—'} · ${item.categorie ?? '—'}`}
            meta={item.chambre?.numero ? `Chambre ${item.chambre.numero}` : undefined}
            accentColor={statutColor(item.statut)}
            right={
              <Text style={{ color: statutColor(item.statut), fontWeight: '600', fontSize: 12 }}>
                {item.statut ?? item.etatTechnique ?? '—'}
              </Text>
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="Aucun équipement"
            subtitle="Aucun équipement dans votre clinique."
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
});
