import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransmissionEditor } from '@/src/components/infirmier/TransmissionEditor';
import { Button } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function TransmissionsScreen(): React.JSX.Element {
  const [contenu, setContenu] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [priorite, setPriorite] = useState<'NORMALE' | 'URGENTE'>('NORMALE');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Transmission ciblée (SBAR)" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.hint}>Transmission structurée vers l&apos;équipe médicale.</Text>
        <TransmissionEditor
          contenu={contenu}
          tags={tags}
          priorite={priorite}
          onContenuChange={setContenu}
          onTagsChange={setTags}
          onPrioriteChange={setPriorite}
        />
        <Button title="Enregistrer la transmission" onPress={() => {}} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 }, // ✨ ScrollView tab bar
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
});
