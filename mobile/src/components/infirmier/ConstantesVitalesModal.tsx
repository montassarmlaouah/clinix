import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface ConstantesVitales {
  tensionSystolique?: number;
  tensionDiastolique?: number;
  pouls?: number;
  temperature?: number;
  spo2?: number;
  douleurEVA?: number;
  observations?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ConstantesVitales) => void;
  loading?: boolean;
}

// Plages normales pour le coloriage des champs
const RANGES: Record<string, { min: number; max: number }> = {
  tensionSystolique: { min: 90, max: 140 },
  tensionDiastolique: { min: 60, max: 90 },
  pouls: { min: 60, max: 100 },
  temperature: { min: 36.0, max: 37.5 },
  spo2: { min: 95, max: 100 },
};

function getFieldColor(key: string, value: string | undefined): string {
  if (!value || !RANGES[key]) return LUNA_COLORS.borderDark;
  const num = parseFloat(value);
  if (isNaN(num)) return LUNA_COLORS.borderDark;
  const { min, max } = RANGES[key];
  return num < min || num > max ? LUNA_COLORS.error : LUNA_COLORS.success;
}

export function ConstantesVitalesModal({ visible, onClose, onSubmit, loading }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const data: ConstantesVitales = {
      tensionSystolique: form.tensionSystolique ? parseInt(form.tensionSystolique) : undefined,
      tensionDiastolique: form.tensionDiastolique ? parseInt(form.tensionDiastolique) : undefined,
      pouls: form.pouls ? parseInt(form.pouls) : undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      spo2: form.spo2 ? parseInt(form.spo2) : undefined,
      douleurEVA: form.douleurEVA ? parseInt(form.douleurEVA) : undefined,
      observations: form.observations?.trim() || undefined,
    };
    onSubmit(data);
    setForm({});
  };

  const fields: Array<{ key: keyof typeof RANGES; label: string; unit: string; decimal?: boolean }> = [
    { key: 'tensionSystolique', label: 'TA systolique', unit: 'mmHg' },
    { key: 'tensionDiastolique', label: 'TA diastolique', unit: 'mmHg' },
    { key: 'pouls', label: 'Fréquence cardiaque', unit: 'bpm' },
    { key: 'temperature', label: 'Température', unit: '°C', decimal: true },
    { key: 'spo2', label: 'SpO₂', unit: '%' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Text style={styles.title}>Constantes vitales</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Annuler</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {fields.map(({ key, label, unit, decimal }) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      { borderColor: getFieldColor(key, form[key]) },
                    ]}
                    placeholder="—"
                    placeholderTextColor={LUNA_COLORS.textDisabled}
                    value={form[key] ?? ''}
                    onChangeText={(v) => update(key, v)}
                    keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
                  />
                  <Text style={styles.unit}>{unit}</Text>
                </View>
              </View>
            ))}

            {/* EVA Douleur 0-10 */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Douleur EVA</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { borderColor: LUNA_COLORS.borderDark }]}
                  placeholder="0-10"
                  placeholderTextColor={LUNA_COLORS.textDisabled}
                  value={form.douleurEVA ?? ''}
                  onChangeText={(v) => update('douleurEVA', v)}
                  keyboardType="number-pad"
                />
                <Text style={styles.unit}>/10</Text>
              </View>
            </View>

            {/* Observations */}
            <View style={styles.observationsContainer}>
              <Text style={styles.fieldLabel}>Observations</Text>
              <TextInput
                style={styles.observations}
                placeholder="Notes cliniques..."
                placeholderTextColor={LUNA_COLORS.textDisabled}
                value={form.observations ?? ''}
                onChangeText={(v) => update('observations', v)}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Enregistrer mesure"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textPrimary,
  },
  closeBtn: { padding: spacing.xs },
  closeBtnText: { color: LUNA_COLORS.error, fontSize: fontSize.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.sm },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  fieldLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    width: 80,
    borderWidth: 2,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: LUNA_COLORS.textPrimary,
    textAlign: 'center',
  },
  unit: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, width: 32 },
  observationsContainer: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  observations: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.border,
  },
  submitBtn: { width: '100%' },
});
