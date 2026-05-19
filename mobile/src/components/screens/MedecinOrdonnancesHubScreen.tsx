import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ordonnanceService } from '@/src/api/services/medecinService';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export function MedecinOrdonnancesHubScreen(): React.JSX.Element {
  const router = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await ordonnanceService.list({ medecinId: String(medecinId) });
      setItems((data as Record<string, unknown>[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Ordonnances" subtitle="Liste et signature" />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item.id ?? i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="document-text-outline" title="Aucune ordonnance" /> : null
        }
        renderItem={({ item }) => {
          const id = String(item.id ?? '');
          const patient = item.patient as Record<string, unknown> | undefined;
          const label = patient
            ? `${patient.prenom ?? ''} ${patient.nom ?? ''}`.trim()
            : `Ordonnance #${id}`;
          return (
            <Pressable
              style={styles.card}
              onPress={() => id && router.push(`/(medecin)/patients/${id}/prescriptions` as never)}
            >
              <Text style={styles.cardTitle}>{label}</Text>
              <Text style={styles.meta}>
                {item.validee ? 'Validée' : item.signee ? 'Signée' : 'Brouillon'}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  card: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.primary,
    ...(shadows.sm as object),
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
