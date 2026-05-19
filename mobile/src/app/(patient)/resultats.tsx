import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  patientPortalService,
  type AnalyseLaboratoire,
} from '@/src/api/services/patient-portal.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientResultatsScreen(): React.JSX.Element {
  const patientId = useAuthStore((s) => s.userId);
  const [analyses, setAnalyses] = useState<AnalyseLaboratoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!patientId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const dossier = await patientPortalService.getDossier(patientId);
      setAnalyses(dossier?.analyses ?? []);
    } catch { setAnalyses([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes résultats</Text>
      </View>
      <FlatList
        data={analyses}
        keyExtractor={(item, i) => item.id ?? String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.type}>{item.typeAnalyse ?? 'Analyse'}</Text>
            <Text style={styles.result}>{item.resultat ?? '—'}</Text>
            <Text style={styles.meta}>
              {item.dateAnalyse ? new Date(item.dateAnalyse).toLocaleDateString('fr-FR') : ''}
              {item.statut ? ` • ${item.statut}` : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="flask-outline" title="Aucun résultat" subtitle="Vos analyses de laboratoire apparaîtront ici." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    padding: spacing.xxl,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderSubtle,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  list: { padding: spacing.xxl, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  type: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  result: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 6 },
  meta: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
