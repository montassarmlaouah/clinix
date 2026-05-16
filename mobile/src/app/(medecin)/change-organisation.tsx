import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function ChangeOrganisationScreen(): React.JSX.Element {
  const { cliniqueId, estCabinet } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Organisation" />
      <View style={styles.body}>
        <Text style={styles.text}>
          {estCabinet
            ? 'Vous exercez en cabinet médical (sans clinique rattachée).'
            : `Clinique active : ${cliniqueId ?? '—'}`}
        </Text>
        <Text style={styles.hint}>
          Le changement d&apos;organisation se fait via la connexion avec un autre compte ou la configuration web.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.xxl, gap: spacing.md },
  text: { fontSize: fontSize.base, color: LUNA_COLORS.darkest },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
});
