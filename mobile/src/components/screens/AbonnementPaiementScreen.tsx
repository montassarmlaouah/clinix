import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Offre {
  id: string;
  nom: string;
  prix?: number;
}

interface CheckoutResponse {
  url?: string;
  checkoutUrl?: string;
}

export function AbonnementPaiementScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Offre[]>(BILLING.OFFRES_ACTIVES);
      setOffres(data ?? []);
    } catch {
      setOffres([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function payerStripe(offreId: string) {
    if (!cliniqueId) return;
    setPaying(true);
    try {
      const res = await apiPost<CheckoutResponse>(BILLING.CHECKOUT, {
        offreId,
        cliniqueId,
        successUrl: 'clinix://abonnement/success',
        cancelUrl: 'clinix://abonnement/cancel',
      });
      const url = res.url ?? res.checkoutUrl;
      if (url) {
        const ok = await Linking.canOpenURL(url);
        if (ok) await Linking.openURL(url);
        else Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement.');
      } else {
        Alert.alert('Info', 'Paiement Stripe non configuré. Utilisez la souscription simulée dans Forfaits.');
      }
    } catch {
      Alert.alert('Erreur', 'Checkout impossible. Vérifiez la configuration Stripe.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Paiement Stripe" subtitle="Sécurisé par Stripe" />
      {loading ? <LoadingOverlay /> : null}
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          Choisissez une offre pour être redirigé vers le paiement sécurisé Stripe (comme sur le portail web).
        </Text>
        {offres.map((o) => (
          <LunaCard key={o.id}>
            <Text style={styles.nom}>{o.nom}</Text>
            <Text style={styles.prix}>{o.prix ?? '—'} TND / mois</Text>
            <Button
              title="Payer avec Stripe"
              onPress={() => void payerStripe(o.id)}
              loading={paying}
              fullWidth
            />
          </LunaCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  intro: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.lg },
  nom: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  prix: { fontSize: fontSize.base, color: LUNA_COLORS.secondary, marginVertical: spacing.sm },
});
