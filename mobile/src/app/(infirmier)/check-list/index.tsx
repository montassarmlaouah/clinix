import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { CHECK_LIST } from '@/src/api/endpoints';
import { CheckListBlocComponent } from '@/src/components/infirmier/CheckListBlocComponent';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { CHECK_LIST_HAS_ITEMS } from '@/src/constants/checkListHAS';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface CheckListItem {
  id: string;
  libelle: string;
  checked: boolean;
  commentaire?: string;
  obligatoire: boolean;
  ordre: number;
}

/** Adapte les items HAS constants en items de l'écran */
const DEFAULT_ITEMS: CheckListItem[] = CHECK_LIST_HAS_ITEMS.map((i, idx) => ({
  id: i.id,
  libelle: i.libelle,
  checked: false,
  commentaire: undefined,
  obligatoire: i.obligatoire,
  ordre: idx + 1,
}));

export default function CheckListScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const { operationId } = useLocalSearchParams<{ operationId?: string }>();

  const [items, setItems] = useState<CheckListItem[]>(DEFAULT_ITEMS);
  const [checkListId, setCheckListId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  /** Charge la check-list existante depuis le backend */
  const loadFromApi = useCallback(async () => {
    if (!operationId) return;
    setLoading(true);
    try {
      const data = await apiGet<Array<{ id: string; items: CheckListItem[] }>>(
        CHECK_LIST.BY_OPERATION(operationId),
      );
      if (data && data.length > 0) {
        const latest = data[0];
        setCheckListId(latest.id);
        // Fusionner avec les items HAS : conserver les libellés officiels
        setItems(
          DEFAULT_ITEMS.map((def) => {
            const saved = latest.items.find((s) => s.id === def.id);
            return saved ? { ...def, checked: saved.checked, commentaire: saved.commentaire } : def;
          }),
        );
      }
    } catch {
      // pas de check-list existante — on part de zéro
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    void loadFromApi();
  }, [loadFromApi]);

  /** Crée ou met à jour un item */
  async function handleChange(id: string, checked: boolean, commentaire?: string): Promise<void> {
    const next = items.map((i) => (i.id === id ? { ...i, checked, commentaire } : i));
    setItems(next);

    if (!operationId) return; // mode hors-ligne uniquement

    try {
      if (!checkListId) {
        // Première modification → créer la check-list sur le backend
        const created = await apiPost<{ id: string }>(CHECK_LIST.CREATE, {
          operationId,
          infirmierId: String(userId),
          items: next.map((i) => ({ id: i.id, libelle: i.libelle, checked: i.checked, commentaire: i.commentaire })),
        });
        setCheckListId(created.id);
      } else {
        // Mise à jour de l'item uniquement
        await apiPatch(CHECK_LIST.UPDATE_ITEM(checkListId, id), { checked, commentaire });
      }
    } catch (err: any) {
      Alert.alert('Attention', `Impossible de synchroniser : ${err?.message ?? 'erreur réseau'}`);
    }
  }

  function handleReset(): void {
    Alert.alert('Réinitialiser', 'Effacer toutes les cases cochées ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser',
        style: 'destructive',
        onPress: () => setItems(DEFAULT_ITEMS.map((i) => ({ ...i, checked: false, commentaire: undefined }))),
      },
    ]);
  }

  const allMandatoryDone = items.filter((i) => i.obligatoire).every((i) => i.checked);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Check-list HAS sécurité" />
      <ScrollView contentContainerStyle={styles.body}>
        {!operationId ? (
          <Text style={styles.hint}>
            ⚠️ Mode hors-ligne — naviguez depuis une fiche opération pour synchroniser avec le serveur.
          </Text>
        ) : (
          <Text style={styles.hint}>
            Check-list officielle HAS — Opération : {operationId}
          </Text>
        )}
        {allMandatoryDone ? (
          <Text style={styles.okBanner}>Tous les points obligatoires sont validés.</Text>
        ) : null}
        <CheckListBlocComponent
          items={items}
          onChange={(id, checked, commentaire) => void handleChange(id, checked, commentaire)}
          disabled={loading}
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
