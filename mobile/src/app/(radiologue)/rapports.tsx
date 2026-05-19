import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { apiGet } from '@/src/api/client';
import { IMAGERIES } from '@/src/api/endpoints';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Imagerie {
  id: string;
  type: string;
  typeExamen?: string;
  date: string;
  urgence?: boolean;
  statut?: string;
  patient?: { id: string; nom: string; prenom: string };
  rapport?: { id: string; signe?: boolean };
}

export default function RapportsScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);

  const [imageries, setImageries] = useState<Imagerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Imagerie[]>(IMAGERIES.BY_RADIOLOGUE(userId));
      setImageries(
        (data ?? []).filter(
          (i) =>
            i.rapport ||
            i.statut === 'REALISE' ||
            i.statut === 'TERMINE' ||
            i.statut === 'VALIDE',
        ),
      );
    } catch {
      /* keep previous */
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Mes examens" subtitle={`${imageries.length} examen(s) réalisé(s)`} />
      <FlatList
        data={imageries}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const date = item.date
            ? new Date(item.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—';
          const isSigne = item.rapport?.signe ?? false;
          const patient = item.patient
            ? `${item.patient.prenom} ${item.patient.nom}`
            : undefined;

          return (
            <ListCard
              title={item.typeExamen ?? item.type}
              subtitle={patient}
              meta={date}
              accentColor={isSigne ? LUNA_COLORS.success : LUNA_COLORS.warning}
              onPress={() => router.push(`/(radiologue)/examen/${item.id}` as never)}
              right={
                <Text style={[styles.statut, { color: isSigne ? LUNA_COLORS.success : LUNA_COLORS.warning }]}>
                  {isSigne ? 'Signé' : 'À signer'}
                </Text>
              }
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-outline"
            title="Aucun examen"
            subtitle="Vos examens terminés apparaîtront ici."
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  // ✨ Liste — paddingBottom tab bar
  list: { padding: spacing.lg, paddingBottom: 80 },
  statut: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
