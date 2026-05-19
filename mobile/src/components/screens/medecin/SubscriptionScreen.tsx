/**
 * SubscriptionScreen — Abonnement + Tarifs + Paiement en un seul écran tabbed.
 * Fusionne abonnement.tsx, tarifs.tsx et abonnement-paiement.tsx.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { AbonnementPaiementScreen } from '@/src/components/screens/AbonnementPaiementScreen';
import { AbonnementTarifsScreen } from '@/src/components/screens/AbonnementTarifsScreen';
import { SegmentTabs } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Offre {
  id: string;
  nom: string;
  type: string;
  prix: number;
  dureeEnMois: number;
  actif: boolean;
  description?: string;
}

interface AbonnementStatus {
  actif: boolean;
  offreNom?: string;
  dateDebut?: string;
  dateFin?: string;
  joursRestants?: number;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function StatusTab(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);

  const [status,     setStatus]     = useState<AbonnementStatus | null>(null);
  const [offres,     setOffres]     = useState<Offre[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statusData, offresData] = await Promise.all([
        apiGet<AbonnementStatus>(BILLING.ABONNEMENT_COURANT).catch(() => null),
        apiGet<Offre[]>(BILLING.OFFRES_ACTIVES).catch(() => []),
      ]);
      setStatus(statusData);
      setOffres(Array.isArray(offresData) ? offresData : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={subStyles.center}>
        <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={subStyles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }}
          tintColor={LUNA_COLORS.secondary}
          colors={[LUNA_COLORS.secondary]}
        />
      }
    >
      <View style={subStyles.iconRow}>
        <Ionicons name="card-outline" size={28} color={LUNA_COLORS.secondary} />
        <Text style={subStyles.heading}>Mon abonnement</Text>
      </View>

      {status ? (
        <View style={subStyles.statusCard}>
          <View style={[subStyles.badge, status.actif ? subStyles.badgeActive : subStyles.badgeInactive]}>
            <Text style={subStyles.badgeText}>{status.actif ? 'Actif' : 'Inactif'}</Text>
          </View>
          {status.offreNom ? <Text style={subStyles.offreName}>{status.offreNom}</Text> : null}
          {status.dateDebut ? (
            <View style={subStyles.row}>
              <Ionicons name="calendar-outline" size={16} color={LUNA_COLORS.textSecondary} />
              <Text style={subStyles.rowLabel}>Début</Text>
              <Text style={subStyles.rowValue}>{formatDate(status.dateDebut)}</Text>
            </View>
          ) : null}
          {status.dateFin ? (
            <View style={subStyles.row}>
              <Ionicons name="calendar-outline" size={16} color={LUNA_COLORS.textSecondary} />
              <Text style={subStyles.rowLabel}>Fin</Text>
              <Text style={subStyles.rowValue}>{formatDate(status.dateFin)}</Text>
            </View>
          ) : null}
          {status.joursRestants !== undefined && status.joursRestants !== null ? (
            <View style={subStyles.daysRow}>
              <Text style={subStyles.daysNum}>{status.joursRestants}</Text>
              <Text style={subStyles.daysLabel}>jours restants</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={subStyles.empty}>
          <Ionicons name="information-circle-outline" size={48} color={LUNA_COLORS.textSecondary} />
          <Text style={subStyles.emptyTitle}>Aucun abonnement actif</Text>
          <Text style={subStyles.emptySub}>Souscrivez à une offre ci-dessous pour activer votre cabinet.</Text>
        </View>
      )}

      <Text style={subStyles.sectionTitle}>Offres disponibles</Text>
      {offres.length === 0 ? (
        <Text style={subStyles.noOffres}>Aucune offre disponible pour le moment.</Text>
      ) : (
        offres.map((offre) => (
          <View key={offre.id} style={subStyles.offreCard}>
            <Text style={subStyles.offreNom}>{offre.nom}</Text>
            <Text style={subStyles.offrePrix}>{offre.prix} TND / {offre.dureeEnMois} mois</Text>
            {offre.description ? <Text style={subStyles.offreDesc}>{offre.description}</Text> : null}
            <Pressable style={subStyles.souscrireBtn}>
              <Ionicons name="checkmark-circle-outline" size={16} color={LUNA_COLORS.textInverse} />
              <Text style={subStyles.souscireBtnTxt}>Souscrire</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const subStyles = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:      { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 },
  iconRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  heading:      { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  statusCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md, padding: spacing.lg, gap: spacing.sm,
    ...(shadows.sm as object),
  },
  badge:        { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeActive:  { backgroundColor: LUNA_COLORS.successLight },
  badgeInactive:{ backgroundColor: LUNA_COLORS.errorLight },
  badgeText:    { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  offreName:    { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  row:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel:     { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, width: 50 },
  rowValue:     { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark, flex: 1 },
  daysRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  daysNum:      { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  daysLabel:    { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
  empty:        { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle:   { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  emptySub:     { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginTop: spacing.lg },
  noOffres:     { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginTop: spacing.md },
  offreCard: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, gap: spacing.xs, marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.borderDark,
  },
  offreNom:     { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  offrePrix:    { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
  offreDesc:    { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  souscrireBtn: {
    flexDirection: 'row', minHeight: 48,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm, marginTop: spacing.sm,
  },
  souscireBtnTxt: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});

// ── Composant exporté ─────────────────────────────────────────────────────────
type SubscriptionStep = 'status' | 'tarifs' | 'paiement';

export interface SubscriptionScreenProps {
  initialStep?: SubscriptionStep;
}

export function SubscriptionScreen({ initialStep = 'status' }: SubscriptionScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SubscriptionStep>(initialStep);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <View style={screenStyles.header}>
        <Text style={screenStyles.title}>Abonnement</Text>
        <Text style={screenStyles.sub}>Offres · Tarifs · Paiement</Text>
      </View>
      <SegmentTabs<SubscriptionStep>
        options={[
          { key: 'status',   label: 'Abonnement' },
          { key: 'tarifs',   label: 'Tarifs'     },
          { key: 'paiement', label: 'Paiement'   },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        onDark={false}
      />
      {activeTab === 'status'   ? <StatusTab />              : null}
      {activeTab === 'tarifs'   ? <AbonnementTarifsScreen /> : null}
      {activeTab === 'paiement' ? <AbonnementPaiementScreen /> : null}
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub:   { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
});
