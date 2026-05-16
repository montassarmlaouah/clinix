import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { CONGES_MEDECIN } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface CongeMedecin {
  id: string | number;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  medecin?: { nom?: string; prenom?: string; specialite?: string };
}

export function CongesMedecinScreen(): React.JSX.Element {
  const medecinId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<CongeMedecin[]>([]);
  const [disponibles, setDisponibles] = useState<CongeMedecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [disp, mine] = await Promise.all([
        apiGet<CongeMedecin[]>(CONGES_MEDECIN.DISPONIBLES).catch(() => []),
        medecinId
          ? apiGet<CongeMedecin[]>(CONGES_MEDECIN.BY_MEDECIN(medecinId)).catch(() => [])
          : Promise.resolve([]),
      ]);
      setDisponibles(disp ?? []);
      setListe(mine ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  const data = [...disponibles, ...liste];

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Congés médecins" subtitle="Disponibilités et congés" />
      <FlatList
        data={data}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              Dr {item.medecin?.prenom} {item.medecin?.nom}
            </Text>
            <Text style={styles.meta}>{item.medecin?.specialite ?? ''}</Text>
            <Text style={styles.meta}>
              {item.dateDebut ? new Date(item.dateDebut).toLocaleDateString('fr-FR') : '—'}
              {' → '}
              {item.dateFin ? new Date(item.dateFin).toLocaleDateString('fr-FR') : '—'}
            </Text>
            <Text style={styles.statut}>{item.statut ?? '—'}</Text>
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
  statut: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.info, marginTop: 4 },
});
