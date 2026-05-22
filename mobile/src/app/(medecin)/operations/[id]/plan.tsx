import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { Button, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

interface PeriopsDetails {
  sallePrevue?: string;
  chambrePrevue?: string;
  remarquesMoyens?: string;
}

interface DemandeOperationDetail {
  id: string;
  periopsDetails?: PeriopsDetails;
}

export default function OperationPlanScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [salle, setSalle] = useState('');
  const [chambre, setChambre] = useState('');
  const [remarques, setRemarques] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiGet<DemandeOperationDetail>(DEMANDES_OPERATION.BY_ID(id));
      if (data?.periopsDetails) {
        setSalle(data.periopsDetails.sallePrevue ?? '');
        setChambre(data.periopsDetails.chambrePrevue ?? '');
        setRemarques(data.periopsDetails.remarquesMoyens ?? '');
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function sauvegarder() {
    if (!id) return;
    setSaving(true);
    try {
      await apiPatch(DEMANDES_OPERATION.PLAN(id), {
        sallePrevue: salle.trim() || null,
        chambrePrevue: chambre.trim() || null,
        remarquesMoyens: remarques.trim() || null,
      });
      Alert.alert('Succès', 'Plan opératoire enregistré.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'enregistrer le plan.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Plan opératoire" subtitle={`Opération #${id}`} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Salle prévue</Text>
        <TextInput style={styles.input} value={salle} onChangeText={setSalle} placeholder="Ex: Salle 3" />
        <Text style={styles.label}>Chambre prévue</Text>
        <TextInput style={styles.input} value={chambre} onChangeText={setChambre} placeholder="Ex: Chambre 12A" />
        <Text style={styles.label}>Remarques / Moyens nécessaires</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={remarques}
          onChangeText={setRemarques}
          placeholder="Matériel, équipe, anesthésie…"
          multiline
          textAlignVertical="top"
        />
        <Button title="Enregistrer le plan" onPress={sauvegarder} fullWidth loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md, paddingBottom: 80 },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  area: { minHeight: 100, textAlignVertical: 'top' },
});
