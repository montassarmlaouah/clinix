import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { infirmierWorkspaceService } from '@/src/api/services/infirmier-workspace.service';
import { TransmissionEditor } from '@/src/components/infirmier/TransmissionEditor';
import { Button } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

interface SavedTransmission {
  id: string;
  contenu: string;
  priorite: string;
  tags: string[];
  date: string;
}

function storageKey(userId: string | number | null): string {
  return `clinix_infirmier_transmissions_${userId ?? 'anon'}`;
}

export default function TransmissionsScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [contenu, setContenu] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [priorite, setPriorite] = useState<'NORMALE' | 'URGENTE'>('NORMALE');
  const [history, setHistory] = useState<SavedTransmission[]>([]);
  const [saving, setSaving] = useState(false);

  const loadHistory = useCallback(async () => {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return;
    try {
      setHistory(JSON.parse(raw) as SavedTransmission[]);
    } catch {
      setHistory([]);
    }
  }, [userId]);

  React.useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function handleSave(): Promise<void> {
    if (!contenu.trim()) {
      Alert.alert('Transmission', 'Le contenu est obligatoire.');
      return;
    }
    setSaving(true);
    const entry: SavedTransmission = {
      id: String(Date.now()),
      contenu: contenu.trim(),
      priorite,
      tags,
      date: new Date().toISOString(),
    };
    const next = [entry, ...history].slice(0, 20);
    try {
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
      setHistory(next);
      if (userId && priorite === 'URGENTE') {
        try {
          await infirmierWorkspaceService.signalementMedecin(String(userId), {
            medecinId: '0',
            message: `[SBAR ${priorite}] ${contenu.trim()}`,
          });
        } catch {
          /* signalement optionnel si pas de médecin cible */
        }
      }
      setContenu('');
      setTags([]);
      setPriorite('NORMALE');
      Alert.alert('Succès', 'Transmission enregistrée.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  }

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
        <Button
          title={saving ? 'Enregistrement…' : 'Enregistrer la transmission'}
          onPress={() => void handleSave()}
          fullWidth
          disabled={saving}
        />
        {history.length > 0 ? (
          <>
            <Text style={styles.historyTitle}>Historique récent</Text>
            {history.slice(0, 5).map((h) => (
              <View key={h.id} style={styles.historyCard}>
                <Text style={styles.historyMeta}>
                  {new Date(h.date).toLocaleString('fr-FR')} · {h.priorite}
                </Text>
                <Text style={styles.historyBody}>{h.contenu}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  historyTitle: { fontSize: fontSize.base, fontWeight: '700', color: LUNA_COLORS.darkest, marginTop: spacing.md },
  historyCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.md,
  },
  historyMeta: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  historyBody: { fontSize: fontSize.sm, color: LUNA_COLORS.darkest, marginTop: 4 },
});
