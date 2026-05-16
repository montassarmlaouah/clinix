import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function PatientSortieScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Sortie patient" subtitle={`Patient #${id}`} />
      <View style={styles.body}>
        <Text style={styles.text}>
          Préparez la sortie (ordonnance de sortie, lettre de liaison) depuis le dossier patient ou le poste web.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.xxl },
  text: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
});
