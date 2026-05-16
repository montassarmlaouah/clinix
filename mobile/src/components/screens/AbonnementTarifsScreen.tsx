import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Offre {
  id: string;
  nom: string;
  description?: string;
  prix?: number;
  prixAnnuel?: number;
  dureeEnMois?: number;
  categorie?: string;
}

export function AbonnementTarifsScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Offre[]>(BILLING.OFFRES_ACTIVES);
      const list = (data ?? []).filter(
        (o) => !o.categorie || o.categorie === 'CLINIQUE',
      );
      setOffres(list);
    } catch {
      setOffres([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prix = (o: Offre) =>
    interval === 'YEARLY' ? (o.prixAnnuel ?? (o.prix ?? 0) * 12) : (o.prix ?? 0);

  async function souscrire(offreId: string) {
    if (!cliniqueId) return;
    setSubscribing(offreId);
    try {
      await apiPost(BILLING.SOUSCRIPTION_SIMULEE, { offreId, intervalle: interval });
      await load();
    } catch {
      /* ignore */
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Forfaits" subtitle="Abonnement clinique" />
      {loading ? <LoadingOverlay /> : null}
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
      >
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, interval === 'MONTHLY' && styles.toggleActive]}
            onPress={() => setInterval('MONTHLY')}
          >
            <Text style={[styles.toggleText, interval === 'MONTHLY' && styles.toggleTextActive]}>Mensuel</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, interval === 'YEARLY' && styles.toggleActive]}
            onPress={() => setInterval('YEARLY')}
          >
            <Text style={[styles.toggleText, interval === 'YEARLY' && styles.toggleTextActive]}>Annuel</Text>
          </Pressable>
        </View>
        {offres.map((o) => (
          <LunaCard key={o.id} accentColor={LUNA_COLORS.primary}>
            <Text style={styles.nom}>{o.nom}</Text>
            <Text style={styles.prix}>{prix(o)} TND</Text>
            {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
            <Button
              title={subscribing === o.id ? 'En cours…' : 'Choisir ce forfait'}
              onPress={() => void souscrire(o.id)}
              loading={subscribing === o.id}
              fullWidth
            />
          </LunaCard>
        ))}
        {offres.length === 0 && !loading ? (
          <Text style={styles.empty}>Aucun forfait disponible.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.full },
  toggleActive: { backgroundColor: LUNA_COLORS.secondary },
  toggleText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  toggleTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  nom: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  prix: { fontSize: fontSize.xl, color: LUNA_COLORS.secondary, marginVertical: spacing.sm },
  desc: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },
  empty: { textAlign: 'center', color: LUNA_COLORS.textSecondary, marginTop: spacing.xl },
});
