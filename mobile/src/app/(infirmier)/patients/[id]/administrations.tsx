// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type StatutAdministration = 'PLANIFIEE' | 'ADMINISTREE' | 'REFUSEE' | 'REPORTÉE';

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PLANIFIEE:    { label: 'Planifiée',     color: LUNA_COLORS.textSecondary, bg: LUNA_COLORS.background,    icon: 'time-outline'           },
  ADMINISTREE:  { label: 'Administrée',    color: LUNA_COLORS.success,      bg: LUNA_COLORS.successLight ?? '#e8f8f0', icon: 'checkmark-circle-outline' },
  REFUSEE:      { label: 'Refusée',        color: LUNA_COLORS.error,         bg: LUNA_COLORS.errorLight,     icon: 'close-circle-outline'    },
  'REPORTÉE':   { label: 'Reportée',       color: LUNA_COLORS.warning,       bg: LUNA_COLORS.warningLight,   icon: 'pause-circle-outline'    },
};

interface AdministrationEntry {
  id: string;
  patientId: string;
  patientNom?: string;
  patientPrenom?: string;
  medicament: string;
  posologie?: string;
  voie?: string;
  heurePlanifiee?: string;
  heureAdministration?: string;
  statut?: StatutAdministration;
  infirmierNom?: string;
  notes?: string;
}

export default function AdministrationsScreen() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const { userId, cliniqueId } = useAuthStore();

  const [administrations, setAdministrations] = useState<AdministrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    try {
      if (!silent) setLoading(true);
      const data = await apiGet<AdministrationEntry[]>(
        ADMINISTRATIONS.BY_PATIENT_AUJOURDHUI(patientId)
      );
      setAdministrations(data ?? []);
    } catch {
      setAdministrations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, cliniqueId, patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: AdministrationEntry }) => {
    const cfg = STATUT_CONFIG[item.statut ?? 'PLANIFIEE'] ?? STATUT_CONFIG.PLANIFIEE;
    return (
      <View style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as never} size={12} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {item.heurePlanifiee ? (
            <Text style={styles.cardHeure}>
              {item.heurePlanifiee}
            </Text>
          ) : null}
        </View>

        <Text style={styles.medicament}>{item.medicament}</Text>
        {item.posologie ? <Text style={styles.detail}>Posologie : {item.posologie}</Text> : null}
        {item.voie ? <Text style={styles.detail}>Voie : {item.voie}</Text> : null}
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        <View style={styles.cardFooter}>
          {item.infirmierNom ? (
            <Text style={styles.auteur}>Par {item.infirmierNom}</Text>
          ) : null}
          {item.heureAdministration ? (
            <Text style={styles.heureAdmin}>
              Administré à {item.heureAdministration}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Administrations du jour</Text>
      </View>

      <FlatList
        data={administrations}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="medkit-outline" size={48} color={LUNA_COLORS.textDisabled} />
            <Text style={styles.emptyText}>Aucune administration prévue aujourd'hui</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },

  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },

  card: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: LUNA_COLORS.border,
    borderLeftWidth: 4,
    ...shadows.sm as object,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: fontWeight.semibold },
  cardHeure: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },

  medicament: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  detail: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 2 },
  notes: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: spacing.xs, lineHeight: 18, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  auteur: { fontSize: fontSize.xs, color: LUNA_COLORS.secondary },
  heureAdmin: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled },
});