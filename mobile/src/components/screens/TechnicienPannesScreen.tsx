import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { technicienService, type Equipement } from '@/src/api/services/technicien.service';
import { Button, EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function TechnicienPannesScreen(): React.JSX.Element {
  const [pannes, setPannes] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [traitement, setTraitement] = useState<string | number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await technicienService.listEnPanne();
      setPannes(data ?? []);
    } catch {
      setPannes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function traiterPanne(id: string | number) {
    Alert.alert('Traiter la panne', 'Marquer comme réparé ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          setTraitement(id);
          try {
            await technicienService.traiterPanne(id, {
              repairType: 'CORRECTIVE',
              repairNotes: 'Intervention mobile',
              repairHours: 1,
              repairMinutes: 0,
            });
            void load(true);
          } catch (e: unknown) {
            Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
          } finally {
            setTraitement(null);
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Pannes" subtitle={`${pannes.length} équipement(s) en panne`} />
      <FlatList
        data={pannes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.wrap}>
            <ListCard
              title={item.nom}
              subtitle={item.descriptionPanne ?? 'Panne signalée'}
              meta={item.chambre?.numero ? `Chambre ${item.chambre.numero}` : item.categorie}
              accentColor={LUNA_COLORS.error}
            />
            <Button
              title={traitement === item.id ? 'Traitement…' : 'Marquer réparé'}
              onPress={() => void traiterPanne(item.id)}
              loading={traitement === item.id}
              fullWidth
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle-outline" title="Aucune panne" subtitle="Tous les équipements sont OK." />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  wrap: { marginBottom: spacing.lg, gap: spacing.sm },
});
