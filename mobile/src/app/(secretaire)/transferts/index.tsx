import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface DemandeOperation {
  id: string | number;
  statut?: string;
  motif?: string;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string };
}

export default function SecretaireTransfertsScreen(): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [liste, setListe] = useState<DemandeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<DemandeOperation[]>(
        `${DEMANDES_OPERATION.LIST}?cliniqueId=${cliniqueId}`,
      );
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
      <View style={styles.header}>
        <Text style={styles.title}>Transferts & opérations</Text>
        <Text style={styles.subtitle}>Demandes liées aux transferts patients</Text>
      </View>
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
            onPress={() => router.push(`/(secretaire)/transferts/${item.id}` as never)}
          >
            <View style={styles.row}>
              <Ionicons name="swap-horizontal-outline" size={22} color={LUNA_COLORS.secondary} />
              <View style={styles.info}>
                <Text style={styles.patient}>
                  {item.patient?.prenom} {item.patient?.nom}
                </Text>
                <Text style={styles.motif}>{item.motif ?? 'Demande opération'}</Text>
              </View>
              <Text style={styles.statut}>{item.statut ?? '—'}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon="swap-horizontal-outline" title="Aucun transfert" subtitle="Les demandes apparaîtront ici." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: { padding: spacing.xxl, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  subtitle: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  list: { padding: spacing.xxl, paddingBottom: 80 },
  // ✨ Carte HeroUI — borderSubtle + shadow sm
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  patient: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  motif: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  statut: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.tertiary },
});
