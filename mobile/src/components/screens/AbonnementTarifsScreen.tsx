import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import {
  fetchOffresActives,
  prixPourPeriode,
  souscriptionSimulee,
  type OffreAbonnementSummary,
} from '@/src/services/billing.service';
import { resolveBillingScope } from '@/src/utils/billingScope';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface AbonnementTarifsScreenProps {
  embedded?: boolean;
  onSelectForPayment?: (offreId: string, interval: 'MONTHLY' | 'YEARLY') => void;
  paymentRoutePrefix?: '/(admin)' | '/(medecin)';
}

export function AbonnementTarifsScreen({
  embedded = false,
  onSelectForPayment,
  paymentRoutePrefix,
}: AbonnementTarifsScreenProps = {}): React.JSX.Element {
  const router = useRouter();
  const { scope: scopeParam, raison: raisonParam } = useLocalSearchParams<{
    scope?: string;
    raison?: string;
  }>();
  const explicitScope =
    scopeParam === 'cabinet' || scopeParam === 'clinique' ? scopeParam : undefined;
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const billingScope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);
  const isCabinetBilling = billingScope === 'cabinet';
  const { status } = useSubscriptionStatus(5 * 60 * 1000, billingScope);
  const abonnementPaye = status?.accesAutorise === true;
  const [offres, setOffres] = useState<OffreAbonnementSummary[]>([]);
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchOffresActives(billingScope);
      const list = data.filter(
        (o) =>
          !o.categorie ||
          o.categorie === (isCabinetBilling ? 'CABINET_MEDICAL' : 'CLINIQUE'),
      );
      setOffres(list);
    } catch {
      setOffres([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [billingScope, isCabinetBilling]);

  useEffect(() => {
    void load();
  }, [load]);

  function allerAuPaiement(offreId: string) {
    if (onSelectForPayment) {
      onSelectForPayment(offreId, interval);
      return;
    }
    const prefix = paymentRoutePrefix ?? (isCabinetBilling ? '/(medecin)' : '/(admin)');
    const scopeQ = isCabinetBilling ? '&scope=cabinet' : '';
    router.push(
      `${prefix}/abonnement-paiement?offreId=${encodeURIComponent(offreId)}&interval=${interval}${scopeQ}` as never,
    );
  }

  async function souscrireSimulee(offreId: string) {
    if (abonnementPaye) return;
    setSubscribing(offreId);
    try {
      await souscriptionSimulee(offreId, interval, billingScope);
      Alert.alert('Succès', 'Abonnement simulé activé.');
      await load();
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Souscription impossible');
    } finally {
      setSubscribing(null);
    }
  }

  const content = (
    <ScrollView
      contentContainerStyle={styles.body}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      {raisonParam === 'paiement_requis' ? (
        <LunaCard accentColor={LUNA_COLORS.warning}>
          <Text style={styles.alertText}>
            Un abonnement actif est requis pour utiliser toutes les fonctionnalités.
          </Text>
        </LunaCard>
      ) : null}

      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleBtn, interval === 'MONTHLY' && styles.toggleActive]}
          onPress={() => setInterval('MONTHLY')}
        >
          <Text style={[styles.toggleText, interval === 'MONTHLY' && styles.toggleTextActive]}>
            Mensuel
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, interval === 'YEARLY' && styles.toggleActive]}
          onPress={() => setInterval('YEARLY')}
        >
          <Text style={[styles.toggleText, interval === 'YEARLY' && styles.toggleTextActive]}>
            Annuel
          </Text>
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
          <Text style={styles.prix}>{prixPourPeriode(o, interval)} TND</Text>
          {o.description ? <Text style={styles.desc}>{o.description}</Text> : null}
          {(o.economieAnnuelleEstimee ?? 0) > 0 && interval === 'YEARLY' ? (
            <Text style={styles.economie}>
              Économie annuelle estimée : {o.economieAnnuelleEstimee} TND
            </Text>
          ) : null}
          <Button
            title={abonnementPaye ? 'Déjà payé' : 'Choisir et payer (Stripe)'}
            onPress={() => allerAuPaiement(o.id)}
            disabled={abonnementPaye}
            fullWidth
          />
          {!abonnementPaye ? (
            <Button
              title={subscribing === o.id ? 'En cours…' : 'Simulation (test)'}
              variant="secondary"
              onPress={() => void souscrireSimulee(o.id)}
              loading={subscribing === o.id}
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </LunaCard>
      ))}

      {offres.length === 0 && !loading ? (
        <Text style={styles.empty}>Aucun forfait disponible.</Text>
      ) : null}
    </ScrollView>
  );

  if (embedded) {
    return content;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Forfaits"
        subtitle={isCabinetBilling ? 'Abonnement cabinet' : 'Abonnement clinique'}
      />
      {loading ? <LoadingOverlay /> : null}
      {content}
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
  economie: { fontSize: fontSize.sm, color: LUNA_COLORS.success, marginBottom: spacing.sm },
  empty: { textAlign: 'center', color: LUNA_COLORS.textSecondary, marginTop: spacing.xl },
  paidText: { fontSize: fontSize.sm, color: LUNA_COLORS.success, fontWeight: fontWeight.semibold },
  alertText: { fontSize: fontSize.sm, color: LUNA_COLORS.warning, fontWeight: fontWeight.medium },
});
