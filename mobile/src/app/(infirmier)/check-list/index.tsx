import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckListBlocComponent } from '@/src/components/infirmier/CheckListBlocComponent';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const DEFAULT_ITEMS = [
  { id: '1', libelle: 'Identité patient vérifiée', checked: false, obligatoire: true, ordre: 1 },
  { id: '2', libelle: 'Bracelet posé', checked: false, obligatoire: true, ordre: 2 },
  { id: '3', libelle: 'Allergies contrôlées', checked: false, obligatoire: false, ordre: 3 },
  { id: '4', libelle: 'Consentement signé', checked: false, obligatoire: true, ordre: 4 },
  { id: '5', libelle: 'Matériel vérifié', checked: false, obligatoire: false, ordre: 5 },
];

function storageKey(userId: string | number | null): string {
  return `clinix_infirmier_checklist_${userId ?? 'anon'}`;
}

export default function CheckListScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(storageKey(userId)).then((raw) => {
      if (raw) {
        try {
          setItems(JSON.parse(raw) as typeof DEFAULT_ITEMS);
        } catch {
          setItems(DEFAULT_ITEMS);
        }
      }
      setLoaded(true);
    });
  }, [userId]);

  const persist = useCallback(
    async (next: typeof DEFAULT_ITEMS) => {
      setItems(next);
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
    },
    [userId],
  );

  function handleReset(): void {
    Alert.alert('Réinitialiser', 'Effacer toutes les cases cochées ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => void persist(DEFAULT_ITEMS.map((i) => ({ ...i, checked: false }))),
      },
    ]);
  }

  if (!loaded) return null;

  const allMandatoryDone = items.filter((i) => i.obligatoire).every((i) => i.checked);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Check-list sécurité" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.hint}>Liste de contrôle pré-intervention — sauvegardée localement.</Text>
        {allMandatoryDone ? (
          <Text style={styles.okBanner}>Tous les points obligatoires sont validés.</Text>
        ) : null}
        <CheckListBlocComponent
          items={items}
          onChange={(id, checked) =>
            void persist(items.map((i) => (i.id === id ? { ...i, checked } : i)))
          }
        />
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Réinitialiser la check-list</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80 },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.md },
  okBanner: {
    backgroundColor: LUNA_COLORS.successLight,
    color: LUNA_COLORS.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  resetBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  resetText: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
});
