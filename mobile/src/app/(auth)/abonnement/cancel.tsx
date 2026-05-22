import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function CheckoutCancelScreen(): React.JSX.Element {
  const router = useRouter();
  const { role, estCabinet } = useAuthStore();

  function goBack() {
    if (estCabinet) {
      router.replace('/(medecin)/abonnement-paiement');
    } else if (role?.includes('ADMIN')) {
      router.replace('/(admin)/abonnement-paiement');
    } else if (role?.includes('SECRETAIRE')) {
      router.replace('/(secretaire)/abonnement-paiement');
    } else {
      router.replace('/(medecin)/abonnement-paiement');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>❌</Text>
      <Text style={styles.title}>Paiement annulé</Text>
      <Text style={styles.subtitle}>
        Le paiement a été annulé. Aucun montant n'a été débité.
      </Text>
      <Button title="Retour au paiement" onPress={goBack} fullWidth />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
});
