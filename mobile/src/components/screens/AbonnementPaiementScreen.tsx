import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BILLING } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import {
  fetchOffresActives,
  prixPourPeriode,
  startStripeCheckout,
  type OffreAbonnementSummary,
} from '@/src/services/billing.service';
import { resolveBillingScope } from '@/src/utils/billingScope';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type BillingPeriod = 'MONTHLY' | 'YEARLY';

export interface AbonnementPaiementScreenProps {
  embedded?: boolean;
  preselectedOffreId?: string;
  preselectedInterval?: BillingPeriod;
}

export function AbonnementPaiementScreen({
  embedded = false,
  preselectedOffreId,
  preselectedInterval,
}: AbonnementPaiementScreenProps = {}): React.JSX.Element {
  const router = useRouter();
  const { scope: scopeParam, offreId: offreIdParam, interval: intervalParam } =
    useLocalSearchParams<{ scope?: string; offreId?: string; interval?: string }>();

  const explicitScope =
    scopeParam === 'cabinet' || scopeParam === 'clinique' ? scopeParam : undefined;
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const billingScope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);
  const isCabinetBilling = billingScope === 'cabinet';

  const resolvedOffreId = preselectedOffreId ?? offreIdParam ?? '';
  const singleOfferMode = !!resolvedOffreId;

  const initialInterval =
    preselectedInterval ??
    (intervalParam?.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY');

  const { status } = useSubscriptionStatus(5 * 60 * 1000, billingScope);
  const abonnementPaye = status?.accesAutorise === true;

  const [offres, setOffres] = useState<OffreAbonnementSummary[]>([]);
  const [selectedOffre, setSelectedOffre] = useState<OffreAbonnementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>(initialInterval);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchOffresActives(billingScope);
      setOffres(data);
      if (resolvedOffreId) {
        const found = data.find((o) => o.id === resolvedOffreId) ?? null;
        setSelectedOffre(found);
        if (!found) {
          setErrorMsg('Forfait introuvable ou inactif.');
        }
      }
    } catch {
      setOffres([]);
      setErrorMsg('Impossible de charger les forfaits.');
    } finally {
      setLoading(false);
    }
  }, [billingScope, resolvedOffreId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (intervalParam?.toUpperCase() === 'YEARLY') setPeriod('YEARLY');
    else if (intervalParam?.toUpperCase() === 'MONTHLY') setPeriod('MONTHLY');
  }, [intervalParam]);

  function buildSuccessUrl(): string {
    return `clinix://abonnement/success?session_id={CHECKOUT_SESSION_ID}&scope=${billingScope}`;
  }

  function buildCancelUrl(offreId: string): string {
    return `clinix://abonnement/cancel?offreId=${encodeURIComponent(offreId)}&interval=${period}&scope=${billingScope}`;
  }

  async function payerStripe(offreId: string) {
    if (abonnementPaye) {
      Alert.alert('Abonnement', 'Votre abonnement est déjà actif et payé.');
      return;
    }
    setPaying(true);
    setErrorMsg(null);
    try {
      const res = await startStripeCheckout({
        offreId,
        interval: period,
        scope: billingScope,
        successUrl: buildSuccessUrl(),
        cancelUrl: buildCancelUrl(offreId),
      });
      const url = res.url ?? res.checkoutUrl;
      if (url) {
        const ok = await Linking.canOpenURL(url);
        if (ok) await Linking.openURL(url);
        else Alert.alert('Erreur', "Impossible d'ouvrir la page de paiement.");
      } else {
        setErrorMsg('Paiement Stripe non configuré. Utilisez la souscription simulée dans Forfaits.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        'Checkout impossible. Vérifiez la configuration Stripe.';
      setErrorMsg(msg);
      Alert.alert('Erreur de paiement', msg);
    } finally {
      setPaying(false);
    }
  }

  function resumeLimites(o: OffreAbonnementSummary): string[] {
    if (o.categorie === 'CABINET_MEDICAL') {
      return [
        `${o.nombrePatientsMax ?? 0} patients max`,
        `${o.nombrePersonnelMax ?? 0} employés max`,
        `${o.nombreRendezVousMax ?? 0} RDV max`,
      ];
    }
    return [
      `${o.smsGratuitsInclus ?? 0} SMS inclus`,
      `${o.nombreChambresMax ?? 0} chambres max`,
      `${o.nombrePersonnelMax ?? 0} personnels max`,
    ];
  }

  const displayOffres = singleOfferMode && selectedOffre ? [selectedOffre] : offres;

  const body = (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.intro}>
        {singleOfferMode
          ? 'Récapitulatif du forfait sélectionné — paiement sécurisé Stripe.'
          : 'Choisissez une période puis une offre pour être redirigé vers le paiement sécurisé Stripe.'}
      </Text>

      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'MONTHLY' && styles.periodBtnActive]}
          onPress={() => setPeriod('MONTHLY')}
        >
          <Text style={[styles.periodTxt, period === 'MONTHLY' && styles.periodTxtActive]}>Mensuel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'YEARLY' && styles.periodBtnActive]}
          onPress={() => setPeriod('YEARLY')}
        >
          <Text style={[styles.periodTxt, period === 'YEARLY' && styles.periodTxtActive]}>Annuel</Text>
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

      {displayOffres.map((o) => (
        <LunaCard key={o.id}>
          <Text style={styles.nom}>{o.nom}</Text>
          <Text style={styles.prix}>
            {prixPourPeriode(o, period)} TND / {period === 'YEARLY' ? 'an' : 'mois'}
          </Text>
          {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
          {(o.periodeEssaiJours ?? 0) > 0 ? (
            <Text style={styles.trial}>
              Essai gratuit : {o.periodeEssaiJours} jour(s)
            </Text>
          ) : null}
          {resumeLimites(o).map((l) => (
            <Text key={l} style={styles.limite}>• {l}</Text>
          ))}
          <Button
            title={abonnementPaye ? 'Déjà payé' : 'Payer avec Stripe'}
            onPress={() => void payerStripe(o.id)}
            loading={paying}
            disabled={abonnementPaye}
            fullWidth
          />
        </LunaCard>
      ))}

      {singleOfferMode && !loading && !selectedOffre ? (
        <Button
          title="Retour aux forfaits"
          variant="secondary"
          onPress={() => router.back()}
          fullWidth
        />
      ) : null}
    </ScrollView>
  );

  if (embedded) {
    return body;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Paiement Stripe" subtitle="Sécurisé par Stripe" />
      {loading ? <LoadingOverlay /> : null}
      {body}
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
  desc: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.sm },
  trial: { fontSize: fontSize.sm, color: LUNA_COLORS.info, marginBottom: spacing.xs },
  limite: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: 2 },
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
