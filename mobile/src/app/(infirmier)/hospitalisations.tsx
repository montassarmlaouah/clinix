import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { apiGet } from '@/src/api/client';
import { HOSPITALISATIONS } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Hospitalisation {
  id: string | number;
  patient?: { id?: string; nom?: string; prenom?: string };
  dateAdmission?: string;
  statut?: string;
}

export default function InfirmierHospitalisationsScreen(): React.JSX.Element {
  const router = useRouter();
  const [liste, setListe] = useState<Hospitalisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Hospitalisation[]>(HOSPITALISATIONS.EN_COURS);
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Hospitalisations en cours" />
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
            onPress={() => {
              if (item.patient?.id) {
                router.push(`/(infirmier)/surveillance-soins?patientId=${item.patient.id}` as never);
              }
            }}
          >
            <Text style={styles.name}>
              {item.patient?.prenom} {item.patient?.nom}
            </Text>
            <Text style={styles.meta}>{item.statut ?? 'EN_COURS'}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="bed-outline" title="Aucune hospitalisation" subtitle="" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  }, // ✨
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
