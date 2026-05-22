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
import {
  CONSTANTE_FIELDS,
  getConstanteStatut,
} from '@/src/hooks/useConstantesValidation';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Noms de champs alignés avec l'API backend */
export interface ConstantesVitales {
  tensionSystolique?:  number;
  tensionDiastolique?: number;
  /** Ex-"pouls" — aligné sur le backend */
  frequenceCardiaque?: number;
  temperature?:        number;
  /** Ex-"spo2" — aligné sur le backend */
  saturationOxygene?:  number;
  douleurEVA?:         number;
  observations?:       string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ConstantesVitales) => void;
  loading?: boolean;
}

function getFieldColor(key: string, value: string | undefined): string {
  const field = CONSTANTE_FIELDS.find((f) => f.key === key);
  if (!field || !value) return LUNA_COLORS.borderDark;
  const statut = getConstanteStatut(value, field);
  if (statut === 'normal')    return LUNA_COLORS.success;
  if (statut === 'attention') return LUNA_COLORS.warning;
  if (statut === 'alerte')    return LUNA_COLORS.error;
  return LUNA_COLORS.borderDark;
}

export function ConstantesVitalesModal({ visible, onClose, onSubmit, loading }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const parse = (k: string, decimal?: boolean) =>
      form[k] ? (decimal ? parseFloat(form[k]) : parseInt(form[k])) : undefined;
    const data: ConstantesVitales = {
      tensionSystolique:  parse('tensionSystolique'),
      tensionDiastolique: parse('tensionDiastolique'),
      frequenceCardiaque: parse('frequenceCardiaque'),
      temperature:        parse('temperature', true),
      saturationOxygene:  parse('saturationOxygene'),
      douleurEVA:         parse('douleurEVA'),
      observations:       form.observations?.trim() || undefined,
    };
    onSubmit(data);
    setForm({});
  };

  const fields: Array<{ key: string; label: string; unit: string; decimal?: boolean }> = [
    { key: 'tensionSystolique',  label: 'TA systolique',       unit: 'mmHg' },
    { key: 'tensionDiastolique', label: 'TA diastolique',      unit: 'mmHg' },
    { key: 'frequenceCardiaque', label: 'Fréquence cardiaque', unit: 'bpm'  },
    { key: 'temperature',        label: 'Température',         unit: '°C',  decimal: true },
    { key: 'saturationOxygene',  label: 'SpO₂',                unit: '%'   },
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
                  style={[styles.input, { borderColor: LUNA_COLORS.borderInput }]} // ✨
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
    borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨
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
    borderRadius: borderRadius.lg, // ✨
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
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
    borderWidth: 1.5,
    borderRadius: borderRadius.md, // ✨
    backgroundColor: LUNA_COLORS.inputBg, // ✨
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: LUNA_COLORS.textPrimary,
    textAlign: 'center',
  },
  unit: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, width: 32 },
  observationsContainer: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, // ✨
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
    padding: spacing.md,
    gap: spacing.sm,
  },
  observations: {
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput, // ✨
    borderRadius: borderRadius.md, // ✨
    backgroundColor: LUNA_COLORS.inputBg, // ✨
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨
  },
  submitBtn: { width: '100%' },
});
