import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { CONGES_MEDECIN } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore, selectCliniqueId } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface MedecinDisponible {
  id: string | number;
  nom?: string;
  prenom?: string;
  specialite?: string;
}

export function CongesMedecinScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore(selectCliniqueId);
  const [liste, setListe] = useState<MedecinDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) return;
    if (!silent) setLoading(true);
    try {
      const url = `${CONGES_MEDECIN.DISPONIBLES}?cliniqueId=${cliniqueId}`;
      const disp = await apiGet<MedecinDisponible[]>(url).catch(() => []);
      setListe(disp ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Congés médecins" subtitle="Disponibilités et congés" />
      <FlatList
        data={liste}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              Dr {item.prenom} {item.nom}
            </Text>
            <Text style={styles.meta}>{item.specialite ?? ''}</Text>
            <Text style={styles.meta}>
              Disponible aujourd'hui
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Aucun congé" subtitle="Aucune information de congé." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.xxl, paddingBottom: 80 }, // ✨ espace tab bar
  card: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg, // ✨ coins 16px
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  statut: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.info, marginTop: 4 },
});
