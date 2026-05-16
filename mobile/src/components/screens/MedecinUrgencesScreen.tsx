import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { URGENCES } from '@/src/api/endpoints';
import { Badge, EmptyState, LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Urgence {
  id: string | number;
  motif?: string;
  description?: string;
  niveau?: string;
  statut?: string;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string };
}

function niveauColor(n?: string): 'error' | 'warning' | 'info' {
  if (n === 'CRITIQUE' || n === 'ELEVEE') return 'error';
  if (n === 'MODEREE') return 'warning';
  return 'info';
}

export function MedecinUrgencesScreen(): React.JSX.Element {
  const medecinId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<Urgence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await apiGet<Urgence[]>(URGENCES.BY_MEDECIN(medecinId));
      setListe(data ?? []);
    } catch {
      try {
        const actives = await apiGet<Urgence[]>(URGENCES.ACTIVES);
        setListe(actives ?? []);
      } catch {
        setListe([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(id: string | number, type: 'charge' | 'resoudre') {
    try {
      const url = type === 'charge' ? URGENCES.PRENDRE_EN_CHARGE(id) : URGENCES.RESOUDRE(id);
      await apiPatch(url, {});
      void load();
    } catch {
      Alert.alert('Erreur', 'Action impossible.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Urgences" subtitle={`${liste.length} alerte(s) active(s)`} />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="warning-outline" title="Aucune urgence" subtitle="Pas d'urgence active." />
          ) : null
        }
        renderItem={({ item }) => (
          <LunaCard accentColor={item.niveau === 'CRITIQUE' ? LUNA_COLORS.error : LUNA_COLORS.warning}>
            <View style={styles.row}>
              <Text style={styles.patient}>
                {item.patient?.prenom} {item.patient?.nom}
              </Text>
              <Badge label={item.niveau ?? '—'} color={niveauColor(item.niveau)} />
            </View>
            <Text style={styles.motif}>{item.motif ?? 'Urgence'}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            <Text style={styles.statut}>Statut : {item.statut ?? '—'}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.btn} onPress={() => void action(item.id, 'charge')}>
                <Text style={styles.btnText}>Prendre en charge</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => void action(item.id, 'resoudre')}>
                <Text style={[styles.btnText, styles.btnTextOutline]}>Résoudre</Text>
              </Pressable>
            </View>
          </LunaCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg, paddingBottom: 80 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patient: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, flex: 1 },
  motif: { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary, marginTop: 4 },
  desc: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  statut: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 6 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1,
    backgroundColor: LUNA_COLORS.secondary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: LUNA_COLORS.secondary },
  btnText: { color: LUNA_COLORS.textInverse, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  btnTextOutline: { color: LUNA_COLORS.secondary },
});
