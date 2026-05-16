import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { SURVEILLANCES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SurveillanceItem {
  id: number;
  patientNom?: string;
  patientPrenom?: string;
  patient?: { nom: string; prenom: string };
  niveau: 'NORMALE' | 'HAUTE' | 'CRITIQUE';
  observation?: string;
  description?: string;
  statut?: string;
  dateCreation: string;
}

const NIVEAU_COLOR: Record<string, string> = {
  NORMALE:   LUNA_COLORS.tertiary,
  HAUTE:     LUNA_COLORS.accentOrange,
  CRITIQUE:  LUNA_COLORS.error,
};

// ── Composant ─────────────────────────────────────────────────────────────────
export default function SignalementsScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState<SurveillanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiGet<SurveillanceItem[]>(SURVEILLANCES.BY_INFIRMIER(String(userId)));
      setItems(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-TN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
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
        <Text style={styles.title}>Mes surveillances</Text>
        <TouchableOpacity
          onPress={() => router.push('/(infirmier)/signalement/creer')}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color={LUNA_COLORS.textInverse} />
        </TouchableOpacity>
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
            <Ionicons name="warning-outline" size={48} color={LUNA_COLORS.tertiary} />
            <Text style={styles.emptyText}>Aucun signalement enregistré</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: NIVEAU_COLOR[item.niveau] ?? LUNA_COLORS.tertiary }]}>
                <Text style={styles.badgeText}>{item.niveau}</Text>
              </View>
            </View>
            {(item.patient || item.patientNom) && (
              <Text style={styles.patient}>
                Patient : {item.patient ? `${item.patient.prenom} ${item.patient.nom}` : `${item.patientPrenom ?? ''} ${item.patientNom ?? ''}`.trim()}
              </Text>
            )}
            <Text style={styles.description} numberOfLines={2}>{item.observation ?? item.description ?? '—'}</Text>
            <Text style={styles.date}>{formatDate(item.dateCreation)}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md,
    backgroundColor: LUNA_COLORS.dark,
  },
  backBtn: { padding: spacing.xs },
  addBtn:  { marginLeft: 'auto', padding: spacing.xs },
  title:   { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  errorBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FF4444', padding: spacing.sm, margin: spacing.md, borderRadius: borderRadius.md,
  },
  errorText:  { color: '#fff', fontSize: fontSize.sm, flex: 1 },
  retryText:  { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginLeft: spacing.sm },
  card: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, gap: spacing.xs,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge:       { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeText:   { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: '#fff' },
  patient:     { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  description: { fontSize: fontSize.sm, color: LUNA_COLORS.dark },
  date:        { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary },
  emptyText:   { fontSize: fontSize.md, color: LUNA_COLORS.tertiary, textAlign: 'center' },
});
