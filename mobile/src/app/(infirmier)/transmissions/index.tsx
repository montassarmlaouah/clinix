import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { infirmierWorkspaceService } from '@/src/api/services/infirmier-workspace.service';
import { TRANSMISSIONS } from '@/src/api/endpoints';
import { TransmissionEditor } from '@/src/components/infirmier/TransmissionEditor';
import { Button } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface MedecinOption {
  id: string;
  nom: string;
  prenom: string;
  specialite?: string;
}

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
  const { userId, cliniqueId } = useAuthStore();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const [contenu, setContenu] = useState('');
  const [type, setType] = useState<'SBAR' | 'SOAP'>('SBAR');
  const [tags, setTags] = useState<string[]>([]);
  const [priorite, setPriorite] = useState<'NORMALE' | 'URGENTE'>('NORMALE');
  const [history, setHistory] = useState<SavedTransmission[]>([]);
  const [saving, setSaving] = useState(false);
  // Médecins disponibles pour la transmission urgente
  const [medecins, setMedecins] = useState<MedecinOption[]>([]);
  const [medecinCibleId, setMedecinCibleId] = useState<string | undefined>();

  // Charger la liste des médecins de la clinique
  useEffect(() => {
    if (!cliniqueId) return;
    apiGet<MedecinOption[]>(`/api/medecins/clinique/${cliniqueId}`)
      .then(setMedecins)
      .catch(() => {});
  }, [cliniqueId]);

  // Réinitialiser le médecin sélectionné si on repasse en NORMALE
  useEffect(() => {
    if (priorite === 'NORMALE') setMedecinCibleId(undefined);
  }, [priorite]);

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
    // Validation : médecin obligatoire pour les transmissions urgentes
    if (priorite === 'URGENTE' && !medecinCibleId) {
      Alert.alert(
        'Médecin requis',
        'Une transmission urgente doit être adressée à un médecin. Sélectionnez-en un ci-dessus.',
      );
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

      // POST vers le backend si patientId disponible
      if (userId && patientId) {
        try {
          await apiPost(TRANSMISSIONS.CREATE, {
            patientId,
            infirmierId: String(userId),
            type,
            contenu: contenu.trim(),
            priorite,
          });
        } catch (apiErr: any) {
          Alert.alert(
            'Attention',
            `Sauvegardée localement mais la synchronisation a échoué : ${apiErr?.message ?? 'erreur réseau'}.`,
          );
        }
      }

      if (userId && priorite === 'URGENTE' && medecinCibleId) {
        try {
          await infirmierWorkspaceService.signalementMedecin(String(userId), {
            medecinId: medecinCibleId,
            message: `[${type} ${priorite}] ${contenu.trim()}`,
            patientId,
          });
        } catch (signErr: any) {
          Alert.alert(
            'Attention',
            `La transmission a été sauvegardée localement mais le signalement au médecin a échoué : ${signErr?.message ?? 'erreur réseau'}.`,
          );
        }
      }
      setContenu('');
      setTags([]);
      setPriorite('NORMALE');
      setType('SBAR');
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
        {!patientId && (
          <Text style={styles.hintWarn}>
            ⚠️ Aucun patient sélectionné — la transmission sera uniquement locale.
          </Text>
        )}
        <TransmissionEditor
          contenu={contenu}
          type={type}
          tags={tags}
          priorite={priorite}
          onContenuChange={setContenu}
          onTypeChange={setType}
          onTagsChange={setTags}
          onPrioriteChange={setPriorite}
        />

        {/* Sélecteur médecin — affiché uniquement pour les transmissions urgentes */}
        {priorite === 'URGENTE' && (
          <View style={styles.medecinSection}>
            <Text style={styles.medecinTitle}>Médecin destinataire * (transmission urgente)</Text>
            {medecins.length === 0 ? (
              <Text style={styles.medecinWarning}>
                ⚠️ Aucun médecin disponible. Impossible d\'envoyer une transmission urgente.
              </Text>
            ) : (
              medecins.map((m) => (
                <Pressable
                  key={m.id}
                  style={[styles.medecinBtn, medecinCibleId === m.id && styles.medecinBtnSelected]}
                  onPress={() => setMedecinCibleId(medecinCibleId === m.id ? undefined : m.id)}
                >
                  <Text style={styles.medecinText}>
                    Dr {m.prenom} {m.nom}{m.specialite ? ` — ${m.specialite}` : ''}
                  </Text>
                </Pressable>
              ))
            )}
            {!medecinCibleId && medecins.length > 0 && (
              <Text style={styles.medecinWarning}>Sélectionnez un médecin pour continuer.</Text>
            )}
          </View>
        )}

        <Button
          title={saving ? 'Enregistrement…' : 'Enregistrer la transmission'}
          onPress={() => void handleSave()}
          fullWidth
          // Désactivé si URGENTE sans médecin sélectionné
          disabled={saving || (priorite === 'URGENTE' && !medecinCibleId)}
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
  hintWarn: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.warning,
    fontStyle: 'italic',
  },
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
  // Sélecteur médecin pour transmissions urgentes
  medecinSection: {
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.error,
    padding: spacing.md,
    gap: spacing.sm,
  },
  medecinTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: LUNA_COLORS.error },
  medecinWarning: { fontSize: fontSize.xs, color: LUNA_COLORS.warning, fontStyle: 'italic' },
  medecinBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    backgroundColor: LUNA_COLORS.surface,
  },
  medecinBtnSelected: { borderColor: LUNA_COLORS.error, backgroundColor: LUNA_COLORS.errorLight },
  medecinText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
});
