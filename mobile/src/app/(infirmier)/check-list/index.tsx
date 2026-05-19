import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckListBlocComponent } from '@/src/components/infirmier/CheckListBlocComponent';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function CheckListScreen(): React.JSX.Element {
  const [items, setItems] = useState([
    { id: '1', libelle: 'Identité patient vérifiée', checked: false, obligatoire: true, ordre: 1 },
    { id: '2', libelle: 'Bracelet posé', checked: false, obligatoire: true, ordre: 2 },
    { id: '3', libelle: 'Allergies contrôlées', checked: false, obligatoire: false, ordre: 3 },
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Check-list sécurité" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.hint}>Liste de contrôle pré-intervention.</Text>
        <CheckListBlocComponent
          items={items}
          onChange={(id, checked) =>
            setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)))
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80 }, // ✨ ScrollView tab bar
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },
});
