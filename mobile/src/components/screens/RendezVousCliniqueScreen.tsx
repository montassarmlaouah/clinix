import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rdvService, type RendezVous } from '@/src/api/services/rdv.service';
import { Badge, EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  /** jour = RDV du jour ; all = agenda clinique complet */
  mode?: 'jour' | 'all';
}

export function RendezVousCliniqueScreen({ mode = 'jour' }: Props): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [items, setItems] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      if (mode === 'all') {
        const all = await rdvService.getRdvClinique(cliniqueId);
        setItems(all ?? []);
      } else {
        const data = await rdvService.getRdvCliniqueJour(cliniqueId);
        setItems(data ?? []);
      }
    } catch {
      try {
        const all = await rdvService.getRdvClinique(cliniqueId);
        setItems(all ?? []);
      } catch {
        setItems([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Rendez-vous"
        subtitle={mode === 'all' ? 'Agenda clinique' : 'Planning du jour'}
      />
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="calendar-outline" title="Aucun rendez-vous" subtitle="Aucun RDV pour aujourd'hui." />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>
                {item.patientPrenom} {item.patientNom}
              </Text>
              <Badge label={item.statut} color={item.statut === 'ANNULE' ? 'error' : 'info'} />
            </View>
            <Text style={styles.time}>{formatTime(item.dateHeure)}</Text>
            <Text style={styles.meta}>
              Dr {item.medecinPrenom} {item.medecinNom} · {item.motif}
            </Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, flex: 1 },
  time: { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary, marginTop: 4 },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
