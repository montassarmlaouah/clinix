import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

interface DemandeOperationDetail {
  id: string;
  compteRendu?: string;
}

export default function OperationCompteRenduScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cr, setCr] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger le compte rendu existant
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiGet<DemandeOperationDetail>(DEMANDES_OPERATION.BY_ID(id));
      if (data?.compteRendu) setCr(data.compteRendu);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function sauvegarder() {
    if (!id || !cr.trim()) {
      Alert.alert('Champ vide', 'Veuillez rédiger le compte rendu avant d\'enregistrer.');
      return;
    }
    setSaving(true);
    try {
      await apiPatch(DEMANDES_OPERATION.COMPTE_RENDU(id), { compteRendu: cr.trim() });
      Alert.alert('Succès', 'Compte rendu enregistré.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'enregistrer le compte rendu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Compte rendu" subtitle={`Opération #${id}`} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Compte rendu opératoire</Text>
        <TextInput
          style={styles.area}
          value={cr}
          onChangeText={setCr}
          placeholder="Rédiger le compte rendu opératoire…"
          multiline
          textAlignVertical="top"
        />
        <Button title="Enregistrer" onPress={sauvegarder} fullWidth loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md, paddingBottom: 80 },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.xs },
  area: {
    minHeight: 200,
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
});
