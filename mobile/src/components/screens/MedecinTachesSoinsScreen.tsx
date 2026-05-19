import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { medecinService } from '@/src/api/services/medecinService';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

function rowLabel(item: Record<string, unknown>): string {
  const p = item.patient as Record<string, unknown> | undefined;
  const patient = p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() : '';
  const tache = String(item.libelle ?? item.typeSoin ?? item.description ?? 'Soin');
  return patient ? `${patient} — ${tache}` : tache;
}

export function MedecinTachesSoinsScreen(): React.JSX.Element {
  const medecinId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await medecinService.getWorkspaceSoinsSuivi(medecinId);
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
      <ScreenHeader title="Tâches infirmiers" subtitle="Suivi des soins prescrits" />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="clipboard-outline" title="Aucune tâche en cours" /> : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{rowLabel(item)}</Text>
            {item.statut ? (
              <Text style={styles.meta}>Statut : {String(item.statut)}</Text>
            ) : null}
            {item.dateHeure ? (
              <Text style={styles.meta}>{String(item.dateHeure)}</Text>
            ) : null}
          </View>
        )}
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
    borderLeftColor: LUNA_COLORS.secondary,
    ...(shadows.sm as object),
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
