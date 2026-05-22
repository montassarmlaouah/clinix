import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function MedecinChangeOrganisationScreen(): React.JSX.Element {
  const { cliniqueId, estCabinet } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <ScreenHeader title="Organisation" />
      <View style={styles.body}>
        <Text style={styles.text}>
          {estCabinet
            ? 'Vous exercez en cabinet médical (sans clinique rattachée).'
            : cliniqueId
              ? `Clinique rattachée : ID ${cliniqueId}`
              : 'Aucune organisation associée.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl },
  text: { fontSize: fontSize.base, color: LUNA_COLORS.dark, lineHeight: 22 },
});
