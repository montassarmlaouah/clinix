import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { resolveBillingScope } from '@/src/utils/billingScope';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Offre {
  id: string;
  nom: string;
  prixMensuel?: number;
  prixAnnuel?: number;
}

interface CheckoutResponse {
  url?: string;
  checkoutUrl?: string;
}

type BillingPeriod = 'monthly' | 'yearly';

export function AbonnementPaiementScreen(): React.JSX.Element {
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const explicitScope =
    scopeParam === 'cabinet' || scopeParam === 'clinique' ? scopeParam : undefined;
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const billingScope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);
  const isCabinetBilling = billingScope === 'cabinet';
  const { status } = useSubscriptionStatus(5 * 60 * 1000, billingScope);
  const abonnementPaye = status?.accesAutorise === true;
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const url = isCabinetBilling ? BILLING.OFFRES_ACTIVES_CABINET : BILLING.OFFRES_ACTIVES;
      const data = await apiGet<Offre[]>(url);
      setOffres(data ?? []);
    } catch {
      setOffres([]);
    } finally {
      setLoading(false);
    }
  }, [isCabinetBilling]);

  useEffect(() => {
    void load();
  }, [load]);

  async function payerStripe(offreId: string) {
    if (abonnementPaye) {
      Alert.alert('Abonnement', 'Votre abonnement est déjà actif et payé.');
      return;
    }
    setPaying(true);
    setErrorMsg(null);
    try {
      const res = await apiPost<CheckoutResponse>(BILLING.CHECKOUT, {
        offreId,
        interval: period,
        scope: billingScope,
        successUrl: 'clinix://abonnement/success',
        cancelUrl: 'clinix://abonnement/cancel',
      });
      const url = res.url ?? res.checkoutUrl;
      if (url) {
        const ok = await Linking.canOpenURL(url);
        if (ok) await Linking.openURL(url);
        else Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement.');
      } else {
        setErrorMsg('Paiement Stripe non configuré. Utilisez la souscription simulée dans Forfaits.');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Checkout impossible. Vérifiez la configuration Stripe.';
      console.error('[Checkout Error]', JSON.stringify(err, null, 2));
      setErrorMsg(msg);
      Alert.alert('Erreur de paiement', msg);
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
          Choisissez une période puis une offre pour être redirigé vers le paiement sécurisé Stripe.
        </Text>

        <View style={styles.periodRow}>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'monthly' && styles.periodBtnActive]}
            onPress={() => setPeriod('monthly')}
          >
            <Text style={[styles.periodTxt, period === 'monthly' && styles.periodTxtActive]}>Mensuel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'yearly' && styles.periodBtnActive]}
            onPress={() => setPeriod('yearly')}
          >
            <Text style={[styles.periodTxt, period === 'yearly' && styles.periodTxtActive]}>Annuel</Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {abonnementPaye ? (
          <View style={styles.paidBox}>
            <Text style={styles.paidText}>
              Abonnement déjà actif et payé. Aucun nouveau paiement n'est requis.
            </Text>
          </View>
        ) : null}

        {offres.map((o) => (
          <LunaCard key={o.id}>
            <Text style={styles.nom}>{o.nom}</Text>
            <Text style={styles.prix}>
              {period === 'yearly' ? (o.prixAnnuel ?? o.prixMensuel ?? '—') : (o.prixMensuel ?? '—')} TND / {period === 'yearly' ? 'an' : 'mois'}
            </Text>
            <Button
              title={abonnementPaye ? 'Déjà payé' : 'Payer avec Stripe'}
              onPress={() => void payerStripe(o.id)}
              loading={paying}
              disabled={abonnementPaye}
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
  body: { padding: spacing.lg, paddingBottom: 80 },
  intro: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.lg },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  periodBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: LUNA_COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUNA_COLORS.border,
  },
  periodBtnActive: { backgroundColor: LUNA_COLORS.primary, borderColor: LUNA_COLORS.primary },
  periodTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.semibold },
  periodTxtActive: { color: '#fff' },
  nom: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  prix: { fontSize: fontSize.base, color: LUNA_COLORS.secondary, marginVertical: spacing.sm },
  errorBox: {
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: LUNA_COLORS.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  paidBox: {
    backgroundColor: LUNA_COLORS.successLight,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  paidText: {
    color: LUNA_COLORS.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
