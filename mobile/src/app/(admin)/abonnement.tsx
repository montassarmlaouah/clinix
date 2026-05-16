// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, View, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface SubscriptionStatus {
  statut: string;
  nomOffre?: string;
  dateExpiration?: string;
  enGrace?: boolean;
}

interface Offre {
  id: string;
  nom: string;
  prix: number;
  dureeEnMois: number;
  description?: string;
}

const STATUT_COLORS: Record<string, string> = {
  ACTIF: '#22c55e',
  GRACE: '#f59e0b',
  EXPIRE: '#ef4444',
  PERIODE_ESSAI: '#3b82f6',
};

export default function AbonnementScreen() {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [souscription, setSouscription] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId || !silent) setLoading(!silent);
    try {
      const [stat, off] = await Promise.all([
        apiGet<SubscriptionStatus>(BILLING.ABONNEMENT_COURANT),
        apiGet<Offre[]>(BILLING.OFFRES_ACTIVES),
      ]);
      setStatus(stat);
      setOffres(Array.isArray(off) ? off : []);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  async function souscrire(offreId: string) {
    if (!cliniqueId) return;
    setSouscription(true);
    try {
      await apiPost(BILLING.SOUSCRIPTION_SIMULEE, { offreId });
      load(true);
    } catch { /* ignore */ } finally {
      setSouscription(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={LUNA_COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  const statutColor = status ? (STATUT_COLORS[status.statut] ?? '#94a3b8') : '#94a3b8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
      >
        <Text style={styles.title}>Abonnement</Text>

        {status && (
          <View style={styles.statusCard}>
            <Text style={styles.label}>Statut actuel</Text>
            <Text style={[styles.statut, { color: statutColor }]}>{status.statut}</Text>
            {status.nomOffre && <Text style={styles.offreName}>{status.nomOffre}</Text>}
            {status.dateExpiration && (
              <Text style={styles.expiry}>Expire : {new Date(status.dateExpiration).toLocaleDateString('fr-FR')}</Text>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Offres disponibles</Text>
        {offres.map((o) => (
          <View key={o.id} style={styles.card}>
            <Text style={styles.offre}>{o.nom}</Text>
            <Text style={styles.prix}>{o.prix} TND / {o.dureeEnMois} mois</Text>
            {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
            <Pressable
              style={[styles.btn, souscription && styles.btnDisabled]}
              onPress={() => souscrire(o.id)}
              disabled={souscription}
            >
              <Text style={styles.btnText}>{souscription ? 'En cours...' : 'Souscrire'}</Text>
            </Pressable>
          </View>
        ))}
        {offres.length === 0 && <Text style={styles.empty}>Aucune offre disponible.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  title:        { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.lg },
  statusCard:   { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  label:        { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary ?? '#94a3b8', marginBottom: spacing.xs },
  statut:       { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.xs },
  offreName:    { fontSize: fontSize.base, color: '#fff', marginBottom: spacing.xs },
  expiry:       { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary ?? '#94a3b8' },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.md },
  card:         { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  offre:        { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.xs },
  prix:         { fontSize: fontSize.base, color: LUNA_COLORS.primary, marginBottom: spacing.xs },
  desc:         { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary ?? '#94a3b8', marginBottom: spacing.md },
  btn:          { backgroundColor: LUNA_COLORS.primary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  empty:        { color: LUNA_COLORS.textSecondary ?? '#94a3b8', textAlign: 'center', marginTop: spacing.xxl },
});
