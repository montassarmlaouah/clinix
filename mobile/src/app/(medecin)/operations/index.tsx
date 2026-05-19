import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type StatutOp = 'EN_ATTENTE' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';

interface OperationItem {
  id: number;
  patientId: number;
  patientNom?: string;
  patientPrenom?: string;
  typeOperation: string;
  datePrevue?: string;
  statut: StatutOp;
}

const STATUT_CONFIG: Record<StatutOp, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: LUNA_COLORS.warning },
  PLANIFIEE:  { label: 'Planifiée',  color: LUNA_COLORS.info },
  EN_COURS:   { label: 'En cours',   color: LUNA_COLORS.secondary },
  TERMINEE:   { label: 'Terminée',   color: LUNA_COLORS.success },
};

const FILTERS: StatutOp[] = ['EN_ATTENTE', 'PLANIFIEE', 'EN_COURS', 'TERMINEE'];

// ── Écran Opérations Médecin ──────────────────────────────────────────────────
export default function OperationsScreen(): React.JSX.Element {
  const router = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [items, setItems] = useState<OperationItem[]>([]);
  const [filter, setFilter] = useState<StatutOp | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await apiGet<OperationItem[]>(
        cliniqueId
          ? `${DEMANDES_OPERATION.LIST}?cliniqueId=${cliniqueId}`
          : `${DEMANDES_OPERATION.LIST}?demandeurId=${medecinId}`
      );
      setItems(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId, cliniqueId]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.statut === filter);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opérations</Text>
        <Text style={styles.headerCount}>{items.length} demandes</Text>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        <Pressable onPress={() => setFilter('ALL')} style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}>
          <Text style={[styles.filterTxt, filter === 'ALL' && styles.filterTxtActive]}>Tout</Text>
        </Pressable>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>{STATUT_CONFIG[f].label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LUNA_COLORS.secondary} colors={[LUNA_COLORS.secondary]} />
        }
        renderItem={({ item }) => {
          const cfg = STATUT_CONFIG[item.statut];
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/(medecin)/operations/${item.id}` as never)}>
              <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                  <Text style={styles.patientName}>{item.patientPrenom ?? ''} {item.patientNom ?? ''}</Text>
                  <Text style={styles.opType}>{item.typeOperation}</Text>
                  <Text style={styles.opDate}>{item.datePrevue ? new Date(item.datePrevue).toLocaleDateString('fr-FR') : 'Date non définie'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="medical-outline" title="Aucune opération" subtitle="Aucune demande pour ce filtre." />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  headerCount: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  filterBar: {
    flexGrow: 0,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨ séparateur subtil
  },
  filterContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  filterChipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  filterTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  filterTxtActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  listContent: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...(shadows.sm as object),
  }, // ✨
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardInfo: { flex: 1 },
  patientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  opType: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  opDate: { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
  badge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
