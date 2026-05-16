import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { patientPortalService, type Ordonnance } from '@/src/api/services/patient-portal.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientOrdonnancesScreen(): React.JSX.Element {
  const patientId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<Ordonnance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!patientId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await patientPortalService.getOrdonnances(patientId);
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes ordonnances</Text>
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
            <Text style={styles.date}>
              {item.dateCreation ? new Date(item.dateCreation).toLocaleDateString('fr-FR') : '—'}
            </Text>
            <Text style={styles.medecin}>
              Dr {item.medecin?.prenom} {item.medecin?.nom}
            </Text>
            <Text style={styles.statut}>{item.statut ?? '—'}</Text>
            {(item.medicaments ?? []).slice(0, 3).map((m, i) => (
              <Text key={i} style={styles.med}>• {m.nom} {m.posologie ? `— ${m.posologie}` : ''}</Text>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="document-text-outline" title="Aucune ordonnance" subtitle="Vos ordonnances apparaîtront ici." />
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
  date: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  medecin: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, marginTop: 4 },
  statut: { fontSize: fontSize.xs, color: LUNA_COLORS.info, marginTop: 2 },
  med: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 4 },
});
