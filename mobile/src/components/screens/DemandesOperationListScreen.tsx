import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  demandesOperationService,
  type DemandeOperation,
} from '@/src/api/services/demandes-operation.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Props {
  detailRoutePrefix: string;
  createRoute?: string;
  title?: string;
}

export function DemandesOperationListScreen({
  detailRoutePrefix,
  createRoute,
  title = 'Demandes d\'opération',
}: Props): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [liste, setListe] = useState<DemandeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const q = new URLSearchParams();
    if (cliniqueId) q.set('cliniqueId', String(cliniqueId));
    try {
      const data = await demandesOperationService.list(q.toString());
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={title} subtitle={`${liste.length} demande(s)`} />
      {createRoute ? (
        <Pressable style={styles.createBtn} onPress={() => router.push(createRoute as never)}>
          <Text style={styles.createBtnText}>+ Nouvelle demande</Text>
        </Pressable>
      ) : null}
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`${detailRoutePrefix}/${item.id}` as never)}
          >
            <Text style={styles.name}>{item.typeOperation ?? 'Opération'}</Text>
            <Text style={styles.meta}>
              {item.patient?.prenom} {item.patient?.nom}
            </Text>
            <Text style={styles.statut}>{item.statut ?? '—'}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon="medical-outline" title="Aucune demande" subtitle="Les demandes apparaîtront ici." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  createBtn: {
    margin: spacing.lg,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.lg, // ✨ coins 16px
    padding: spacing.md,
    alignItems: 'center',
    ...(shadows.sm as object),
  },
  createBtnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  list: { padding: spacing.xxl, paddingBottom: 80 }, // ✨ espace tab bar
  card: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  statut: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.tertiary, marginTop: 4 },
});
