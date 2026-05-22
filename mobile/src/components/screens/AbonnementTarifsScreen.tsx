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
import { useLocalSearchParams } from 'expo-router';

import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { resolveBillingScope } from '@/src/utils/billingScope';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
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
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const explicitScope =
    scopeParam === 'cabinet' || scopeParam === 'clinique' ? scopeParam : undefined;
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const billingScope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);
  const isCabinetBilling = billingScope === 'cabinet';
  const { status } = useSubscriptionStatus(5 * 60 * 1000, billingScope);
  const abonnementPaye = status?.accesAutorise === true;
  const [offres, setOffres] = useState<Offre[]>([]);
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const url = isCabinetBilling ? BILLING.OFFRES_ACTIVES_CABINET : BILLING.OFFRES_ACTIVES;
      const data = await apiGet<Offre[]>(url);
      const list = (data ?? []).filter(
        (o) => !o.categorie || o.categorie === (isCabinetBilling ? 'CABINET_MEDICAL' : 'CLINIQUE'),
      );
      setOffres(list);
    } catch {
      setOffres([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isCabinetBilling]);

  useEffect(() => {
    void load();
  }, [load]);

  const prix = (o: Offre) =>
    interval === 'YEARLY' ? (o.prixAnnuel ?? (o.prix ?? 0) * 12) : (o.prix ?? 0);

  async function souscrire(offreId: string) {
    if (abonnementPaye) return;
    setSubscribing(offreId);
    try {
      await apiPost(BILLING.SOUSCRIPTION_SIMULEE, {
        offreId,
        interval,
        ...(isCabinetBilling ? { scope: 'cabinet' } : {}),
      });
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
        {abonnementPaye ? (
          <LunaCard accentColor={LUNA_COLORS.success}>
            <Text style={styles.paidText}>
              Abonnement déjà actif et payé. Aucun nouveau paiement n'est requis pour cette période.
            </Text>
          </LunaCard>
        ) : null}
        {offres.map((o) => (
          <LunaCard key={o.id} accentColor={LUNA_COLORS.primary}>
            <Text style={styles.nom}>{o.nom}</Text>
            <Text style={styles.prix}>{prix(o)} TND</Text>
            {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
            <Button
              title={abonnementPaye ? 'Déjà payé' : subscribing === o.id ? 'En cours…' : 'Choisir ce forfait'}
              onPress={() => void souscrire(o.id)}
              loading={subscribing === o.id}
              disabled={abonnementPaye}
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
  body: { padding: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  toggle: {
    flexDirection: 'row',
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: 4,
    marginBottom: spacing.lg,
    ...(shadows.sm as object),
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.full },
  toggleActive: { backgroundColor: LUNA_COLORS.secondary },
  toggleText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  toggleTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  nom: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  prix: { fontSize: fontSize.xl, color: LUNA_COLORS.secondary, marginVertical: spacing.sm },
  desc: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },
  empty: { textAlign: 'center', color: LUNA_COLORS.textSecondary, marginTop: spacing.xl },
  paidText: { fontSize: fontSize.sm, color: LUNA_COLORS.success, fontWeight: fontWeight.semibold },
});
