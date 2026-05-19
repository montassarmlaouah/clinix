import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { patientPortalService } from '@/src/api/services/patient-portal.service';
import type { RendezVous } from '@/src/api/services/rdv.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientRendezVousScreen(): React.JSX.Element {
  const patientId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!patientId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await patientPortalService.getRendezVous(patientId);
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
        <Text style={styles.title}>Mes rendez-vous</Text>
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
              {new Date(item.dateHeure).toLocaleString('fr-FR', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            <Text style={styles.motif}>{item.motif}</Text>
            <Text style={styles.medecin}>
              Dr {item.medecinPrenom} {item.medecinNom}
              {item.medecinSpecialite ? ` — ${item.medecinSpecialite}` : ''}
            </Text>
            <View style={[styles.badge, badgeColor(item.statut)]}>
              <Text style={styles.badgeText}>{item.statut}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Aucun rendez-vous" subtitle="Vos rendez-vous apparaîtront ici." />
        }
      />
    </SafeAreaView>
  );
}

function badgeColor(statut: string) {
  if (statut === 'ANNULE') return { backgroundColor: LUNA_COLORS.errorLight };
  if (statut === 'CONFIRME' || statut === 'ARRIVE') return { backgroundColor: LUNA_COLORS.successLight };
  return { backgroundColor: LUNA_COLORS.infoLight };
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
  date: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  motif: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, marginTop: 4 },
  medecin: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.sm },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
});
