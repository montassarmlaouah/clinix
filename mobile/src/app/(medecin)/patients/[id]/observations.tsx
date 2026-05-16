import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { DOSSIERS } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function PatientObservationsScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await apiGet<{ id?: string }>(DOSSIERS.BY_PATIENT(id));
      if (d?.id) {
        setDossierId(String(d.id));
        const n = await apiGet<{ notesConfidentielles?: string }>(DOSSIERS.NOTES_CONF(d.id));
        setNotes(n.notesConfidentielles ?? '');
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!dossierId) return;
    setSaving(true);
    try {
      await apiPatch(DOSSIERS.NOTES_CONF(dossierId), { notesConfidentielles: notes });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Notes confidentielles" />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.hint}>Notes internes médecin (non visibles patient).</Text>
        <TextInput style={styles.area} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
        <Button title="Enregistrer" onPress={save} loading={saving} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  area: {
    minHeight: 160,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
});
