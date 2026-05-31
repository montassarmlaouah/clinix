import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/src/components/common';
import { confirmStripeCheckout } from '@/src/services/billing.service';
import { useAuthStore } from '@/src/store/auth.store';
import { hydrateCabinetAccess } from '@/src/utils/hydrateCabinetAccess';
import { resolveBillingScope } from '@/src/utils/billingScope';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function CheckoutSuccessScreen(): React.JSX.Element {
  const router = useRouter();
  const { session_id, scope: scopeParam } = useLocalSearchParams<{
    session_id?: string;
    scope?: string;
  }>();
  const { role, estCabinet, cliniqueId, accesCabinet } = useAuthStore();

  const [confirming, setConfirming] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const explicitScope =
    scopeParam === 'cabinet' || scopeParam === 'clinique' ? scopeParam : undefined;
  const billingScope = resolveBillingScope(estCabinet, cliniqueId, explicitScope, accesCabinet);

  useEffect(() => {
    async function confirm() {
      const sessionId = typeof session_id === 'string' ? session_id.trim() : '';
      if (!sessionId) {
        setError('Session Stripe introuvable. Le webhook peut activer l\'abonnement sous peu.');
        setConfirming(false);
        return;
      }
      try {
        const res = await confirmStripeCheckout(sessionId, billingScope);
        setMessage(res.message ?? 'Paiement confirmé. Votre abonnement est actif.');
        await hydrateCabinetAccess();
      } catch (e: unknown) {
        const msg =
          (e as { message?: string })?.message ??
          'Confirmation en attente — réessayez dans quelques secondes.';
        setError(msg);
      } finally {
        setConfirming(false);
      }
    }
    void confirm();
  }, [session_id, billingScope]);

  function goBack() {
    if (estCabinet || billingScope === 'cabinet') {
      router.replace('/(medecin)/abonnement?scope=cabinet');
    } else if (role?.includes('ADMIN')) {
      router.replace('/(admin)/abonnement');
    } else if (role?.includes('SECRETAIRE')) {
      router.replace('/(admin)/abonnement');
    } else {
      router.replace('/(medecin)/abonnement');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {confirming ? (
        <>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
          <Text style={styles.subtitle}>Confirmation du paiement en cours…</Text>
        </>
      ) : (
        <>
          <Text style={styles.emoji}>{error ? '⚠️' : '✅'}</Text>
          <Text style={styles.title}>{error ? 'Confirmation en attente' : 'Paiement réussi'}</Text>
          <Text style={styles.subtitle}>
            {error ?? message ?? 'Votre abonnement a été activé.'}
          </Text>
          <Button title="Retour à mon abonnement" onPress={goBack} fullWidth />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LUNA_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  emoji: { fontSize: 64, marginBottom: spacing.sm },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
