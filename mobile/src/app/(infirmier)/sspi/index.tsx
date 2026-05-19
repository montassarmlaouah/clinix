import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SSPIGraph } from '@/src/components/infirmier/SSPIGraph';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function SSPIScreen(): React.JSX.Element {
  const now = new Date();
  const mesures = [0, 1, 2].map((h) => ({
    timestamp: new Date(now.getTime() + h * 3600000).toISOString(),
    spo2: 98 - h,
    tensionSystolique: 120 - h * 2,
    pouls: 72 + h,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="SSPI — surveillance post-intervention" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.hint}>Suivi des constantes en salle de réveil.</Text>
        <SSPIGraph mesures={mesures} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80 }, // ✨ ScrollView tab bar
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },
});
