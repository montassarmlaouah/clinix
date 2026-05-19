import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiGet } from '@/src/api/client';
import { HOSPITALISATIONS } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Hospitalisation {
  id: number;
  dateEntree: string;
  dateSortiePrevue?: string;
  dateSortieReelle?: string;
  statut: 'EN_COURS' | 'TERMINE' | 'PLANIFIE';
  motif?: string;
  chambre?: { numero: string; type: string };
  service?: { nom: string };
}

const STATUT_LABEL: Record<string, string> = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  PLANIFIE: 'Planifié',
};

const STATUT_COLOR: Record<string, string> = {
  EN_COURS: LUNA_COLORS.success,
  TERMINE: LUNA_COLORS.tertiary,
  PLANIFIE: LUNA_COLORS.accentOrange,
};

// ── Composant ─────────────────────────────────────────────────────────────────
export default function HospitalisationsScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Hospitalisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Hospitalisation[]>(
        HOSPITALISATIONS.BY_PATIENT(String(id)),
      );
      setItems(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Hospitalisations</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bed-outline" size={48} color={LUNA_COLORS.tertiary} />
            <Text style={styles.emptyText}>Aucune hospitalisation enregistrée</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: STATUT_COLOR[item.statut] ?? LUNA_COLORS.tertiary }]}>
                <Text style={styles.badgeText}>{STATUT_LABEL[item.statut] ?? item.statut}</Text>
              </View>
              {item.service && (
                <Text style={styles.service}>{item.service.nom}</Text>
              )}
            </View>

            <View style={styles.row}>
              <Ionicons name="enter-outline" size={14} color={LUNA_COLORS.tertiary} />
              <Text style={styles.label}>Entrée : <Text style={styles.value}>{formatDate(item.dateEntree)}</Text></Text>
            </View>

            {item.dateSortiePrevue && (
              <View style={styles.row}>
                <Ionicons name="exit-outline" size={14} color={LUNA_COLORS.tertiary} />
                <Text style={styles.label}>Sortie prévue : <Text style={styles.value}>{formatDate(item.dateSortiePrevue)}</Text></Text>
              </View>
            )}

            {item.dateSortieReelle && (
              <View style={styles.row}>
                <Ionicons name="checkmark-circle-outline" size={14} color={LUNA_COLORS.success} />
                <Text style={styles.label}>Sortie réelle : <Text style={styles.value}>{formatDate(item.dateSortieReelle)}</Text></Text>
              </View>
            )}

            {item.chambre && (
              <View style={styles.row}>
                <Ionicons name="bed-outline" size={14} color={LUNA_COLORS.tertiary} />
                <Text style={styles.label}>Chambre : <Text style={styles.value}>{item.chambre.numero} ({item.chambre.type})</Text></Text>
              </View>
            )}

            {item.motif && (
              <Text style={styles.motif}>{item.motif}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: LUNA_COLORS.background },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  list:           { padding: spacing.md, gap: spacing.sm },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop:      spacing.xl,
    paddingBottom:   spacing.md,
    backgroundColor: LUNA_COLORS.dark,
  },
  backBtn:     { padding: spacing.xs },
  title:       { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  errorBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FF4444', padding: spacing.sm, margin: spacing.md, borderRadius: borderRadius.md,
  },
  errorText:  { color: '#fff', fontSize: fontSize.sm, flex: 1 },
  retryText:  { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginLeft: spacing.sm },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius:    borderRadius.lg,
    padding:         spacing.md,
    gap:             spacing.xs,
  }, // ✨
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  service:   { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label:     { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary },
  value:     { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  motif:     { fontSize: fontSize.sm, color: LUNA_COLORS.textInverse, fontStyle: 'italic', marginTop: spacing.xs },
  emptyText: { fontSize: fontSize.md, color: LUNA_COLORS.tertiary, textAlign: 'center' },
});
