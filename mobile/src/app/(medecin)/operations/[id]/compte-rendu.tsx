import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function OperationCompteRenduScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cr, setCr] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Compte rendu" subtitle={`Opération #${id}`} />
      <ScrollView contentContainerStyle={styles.form}>
        <TextInput
          style={styles.area}
          value={cr}
          onChangeText={setCr}
          placeholder="Rédiger le compte rendu opératoire…"
          multiline
          textAlignVertical="top"
        />
        <Button title="Enregistrer le brouillon" onPress={() => {}} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md, paddingBottom: 80 }, // ✨ ScrollView tab bar
  // ✨ input HeroUI
  area: {
    minHeight: 52,
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
});
