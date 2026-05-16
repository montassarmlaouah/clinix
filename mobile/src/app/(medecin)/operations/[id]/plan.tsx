import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { demandesOperationService } from '@/src/api/services/demandes-operation.service';
import { Button, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

export default function OperationPlanScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [salle, setSalle] = useState('');
  const [chambre, setChambre] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      await demandesOperationService.byId(id);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Plan opératoire" subtitle={`Opération #${id}`} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Salle prévue</Text>
        <TextInput style={styles.input} value={salle} onChangeText={setSalle} />
        <Text style={styles.label}>Chambre prévue</Text>
        <TextInput style={styles.input} value={chambre} onChangeText={setChambre} />
        <Button title="Enregistrer (brouillon local)" onPress={() => {}} fullWidth />
        <Text style={styles.hint}>Complétez le plan détaillé sur le poste web si nécessaire.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    padding: spacing.md,
  },
  hint: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },
});
