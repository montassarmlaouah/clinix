import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { chefPersonnelService, type Absence } from '@/src/api/services/chef-personnel.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function ChefCongesScreen(): React.JSX.Element {
  const [liste, setListe] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await chefPersonnelService.listAbsencesEnAttente();
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function traiter(id: string | number, action: 'approuver' | 'refuser') {
    try {
      if (action === 'approuver') await chefPersonnelService.approuverAbsence(id);
      else await chefPersonnelService.refuserAbsence(id);
      load(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Demandes de congé</Text>
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
            <Text style={styles.meta}>{item.motif ?? '—'}</Text>
            <Text style={styles.meta}>
              {item.dateDebut ? new Date(item.dateDebut).toLocaleDateString('fr-FR') : '—'}
              {' → '}
              {item.dateFin ? new Date(item.dateFin).toLocaleDateString('fr-FR') : '—'}
            </Text>
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.ok]} onPress={() => traiter(item.id, 'approuver')}>
                <Text style={styles.btnText}>Approuver</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.ko]} onPress={() => traiter(item.id, 'refuser')}>
                <Text style={styles.btnText}>Refuser</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="airplane-outline" title="Aucune demande" subtitle="Toutes les demandes sont traitées." />
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
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  ok: { backgroundColor: LUNA_COLORS.success },
  ko: { backgroundColor: LUNA_COLORS.error },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
