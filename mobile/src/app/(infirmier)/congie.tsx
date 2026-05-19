import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { ABSENCES } from '@/src/api/endpoints';
import { Button, EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Absence {
  id: string | number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  motif?: string;
}

export default function InfirmierCongieScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Absence[]>(ABSENCES.BY_INFIRMIER(userId));
      setListe(data ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function demander() {
    try {
      await apiPost(ABSENCES.DEMANDE, {
        infirmierId: userId,
        dateDebut: new Date().toISOString().slice(0, 10),
        dateFin: new Date().toISOString().slice(0, 10),
        motif: 'Demande mobile',
      });
      load(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Mes congés" />
      <Button title="Demander un congé" onPress={demander} style={{ margin: spacing.lg }} />
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card}>
            <Text style={styles.statut}>{item.statut}</Text>
            <Text style={styles.meta}>{item.motif}</Text>
            <Text style={styles.meta}>
              {item.dateDebut} → {item.dateFin}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="airplane-outline" title="Aucun congé" subtitle="" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: { backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm }, // ✨
  statut: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
