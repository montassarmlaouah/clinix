import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { demandesOperationService } from '@/src/api/services/demandes-operation.service';
import { Button } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function NouvelleOperationScreen(): React.JSX.Element {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [typeOperation, setTypeOperation] = useState('');
  const [description, setDescription] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!patientId || !typeOperation.trim()) {
      Alert.alert('Erreur', 'Type d\'opération et patient requis.');
      return;
    }
    setLoading(true);
    try {
      const op = await demandesOperationService.create({
        patientId,
        typeOperation: typeOperation.trim(),
        description,
        datePrevue: datePrevue || undefined,
        priorite: 'NORMALE',
        origine: 'CLINIQUE',
        cliniqueCibleId: cliniqueId ?? undefined,
      });
      router.replace(`/(medecin)/operations/${op.id}` as never);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Nouvelle opération" subtitle={`Patient #${patientId ?? '—'}`} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Type</Text>
        <TextInput style={styles.input} value={typeOperation} onChangeText={setTypeOperation} />
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.area]} value={description} onChangeText={setDescription} multiline />
        <Text style={styles.label}>Date prévue (AAAA-MM-JJ)</Text>
        <TextInput style={styles.input} value={datePrevue} onChangeText={setDatePrevue} />
        <Button title="Créer la demande" onPress={submit} loading={loading} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  }, // ✨
  area: { minHeight: 100, textAlignVertical: 'top' },
});
