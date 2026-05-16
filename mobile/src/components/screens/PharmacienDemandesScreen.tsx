import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { pharmacieService, type DemandeMedicament } from '@/src/api/services/pharmacie.service';
import { Button, EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export function PharmacienDemandesScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [demandes, setDemandes] = useState<DemandeMedicament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await pharmacieService.listDemandesEnAttente(cliniqueId);
      setDemandes(data ?? []);
    } catch {
      setDemandes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  function changerStatut(id: string, statut: 'DELIVREE' | 'PARTIELLE' | 'REFUSEE') {
    Alert.alert('Confirmer', `Marquer comme ${statut} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await pharmacieService.changerStatutDemande(id, statut);
            void load(true);
          } catch (e: unknown) {
            Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Demandes médicaments" subtitle={`${demandes.length} en attente`} />
      <FlatList
        data={demandes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ListCard
              title={`${item.patient?.prenom ?? ''} ${item.patient?.nom ?? ''}`.trim() || 'Patient'}
              subtitle={`Demandeur : ${item.demandeur?.prenom ?? ''} ${item.demandeur?.nom ?? ''}`.trim()}
              meta={(item.items ?? []).map((l) => `${l.medicament?.nom} ×${l.quantite}`).join(' · ')}
              accentColor={LUNA_COLORS.accentGold}
            />
            <View style={styles.actions}>
              <Button title="Délivrer" size="sm" onPress={() => changerStatut(item.id, 'DELIVREE')} />
              <Button title="Partielle" size="sm" variant="ghost" onPress={() => changerStatut(item.id, 'PARTIELLE')} />
              <Button title="Refuser" size="sm" variant="danger" onPress={() => changerStatut(item.id, 'REFUSEE')} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="clipboard-outline" title="Aucune demande" subtitle="Toutes les demandes sont traitées." />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
  cardWrap: { marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
});
