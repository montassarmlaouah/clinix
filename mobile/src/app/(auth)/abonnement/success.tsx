import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function CheckoutSuccessScreen(): React.JSX.Element {
  const router = useRouter();
  const { role, estCabinet } = useAuthStore();

  function goBack() {
    if (estCabinet) {
      router.replace('/(medecin)/abonnement');
    } else if (role?.includes('ADMIN')) {
      router.replace('/(admin)/abonnement');
    } else if (role?.includes('SECRETAIRE')) {
      router.replace('/(secretaire)/abonnement');
    } else {
      router.replace('/(medecin)/abonnement');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Paiement réussi</Text>
      <Text style={styles.subtitle}>
        Votre abonnement a été activé. Vous pouvez maintenant utiliser toutes les fonctionnalités.
      </Text>
      <Button title="Retour à mon abonnement" onPress={goBack} fullWidth />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
});
