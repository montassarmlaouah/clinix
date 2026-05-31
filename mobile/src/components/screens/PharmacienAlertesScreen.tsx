import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { pharmacieService, type Stock } from '@/src/api/services/pharmacie.service';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export function PharmacienAlertesScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [alertes, setAlertes] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

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

  async function renvoyerEmail(stock: Stock) {
    setSendingId(stock.id);
    try {
      await pharmacieService.renvoyerAlerteEmail(stock.id);
      Alert.alert('Succès', 'Alerte e-mail renvoyée aux pharmaciens et administrateurs.');
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Envoi impossible');
    } finally {
      setSendingId(null);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Alertes stock" subtitle={`${alertes.length} alerte(s) active(s)`} />
      <FlatList
        data={alertes}
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
          <View style={styles.cardWrap}>
            <ListCard
              title={item.medicament?.nom ?? 'Médicament'}
              subtitle={`Quantité : ${item.quantite} / seuil ${item.seuilAlerte}`}
              meta={`Lot ${item.lot}${item.dateExpiration ? ` · Exp. ${item.dateExpiration}` : ''}`}
              accentColor={LUNA_COLORS.warning}
            />
            <Pressable
              style={styles.emailBtn}
              onPress={() => void renvoyerEmail(item)}
              disabled={sendingId === item.id}
            >
              <Text style={styles.emailBtnText}>
                {sendingId === item.id ? 'Envoi…' : 'Renvoyer alerte e-mail'}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle-outline" title="RAS" subtitle="Aucun stock en alerte." />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
  cardWrap: { marginBottom: spacing.md },
  emailBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: LUNA_COLORS.secondaryLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  emailBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary,
  },
});
