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

export default function MedecinAbonnementScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);

  const [status, setStatus] = useState<AbonnementStatus | null>(null);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
      </SafeAreaView>
    );
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
      >
        <View style={styles.header}>
          <Ionicons name="card-outline" size={28} color={LUNA_COLORS.secondary} />
          <Text style={styles.title}>Mon abonnement</Text>
        </View>

        {status ? (
          <View style={styles.statusCard}>
            <View style={[styles.badge, status.actif ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={styles.badgeText}>{status.actif ? 'Actif' : 'Inactif'}</Text>
            </View>
            {status.offreNom ? (
              <Text style={styles.offreName}>{status.offreNom}</Text>
            ) : null}
            {status.dateDebut ? (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={LUNA_COLORS.textSecondary} />
                <Text style={styles.detailLabel}>Début</Text>
                <Text style={styles.detailValue}>{formatDate(status.dateDebut)}</Text>
              </View>
            ) : null}
            {status.dateFin ? (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={LUNA_COLORS.textSecondary} />
                <Text style={styles.detailLabel}>Fin</Text>
                <Text style={styles.detailValue}>{formatDate(status.dateFin)}</Text>
              </View>
            ) : null}
            {status.joursRestants !== undefined && status.joursRestants !== null ? (
              <View style={styles.daysWrap}>
                <Text style={styles.daysNumber}>{status.joursRestants}</Text>
                <Text style={styles.daysLabel}>jours restants</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyStatus}>
            <Ionicons name="information-circle-outline" size={48} color={LUNA_COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun abonnement actif</Text>
            <Text style={styles.emptySub}>Souscrivez à une offre ci-dessous pour activer votre cabinet.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Offres disponibles</Text>
        {offres.length === 0 ? (
          <Text style={styles.noOffres}>Aucune offre disponible pour le moment.</Text>
        ) : (
          offres.map((offre) => (
            <View key={offre.id} style={styles.offreCard}>
              <Text style={styles.offreNom}>{offre.nom}</Text>
              <Text style={styles.offrePrix}>{offre.prix} TND / {offre.dureeEnMois} mois</Text>
              {offre.description ? <Text style={styles.offreDesc}>{offre.description}</Text> : null}
              <Pressable
                style={styles.souscrireBtn}
                onPress={() => {
                  // Navigate to Stripe checkout or subscription flow
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={LUNA_COLORS.textInverse} />
                <Text style={styles.souscrireBtnTxt}>Souscrire</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  statusCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...(shadows.sm as object),
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeActive: { backgroundColor: LUNA_COLORS.successLight },
  badgeInactive: { backgroundColor: LUNA_COLORS.errorLight },
  badgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  offreName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginTop: spacing.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  detailLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, width: 50 },
  detailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark, flex: 1 },
  daysWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  daysNumber: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  daysLabel: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
  emptyStatus: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  emptySub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginTop: spacing.md },
  noOffres: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginTop: spacing.md },
  offreCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  offreNom: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  offrePrix: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },
  offreDesc: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  souscrireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  souscrireBtnTxt: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});