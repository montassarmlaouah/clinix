import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface OrdonnanceLine {
  medicament: string;
  posologie: string;
  duree: string;
}

interface OrdonnanceSortieBuilderProps {
  value: OrdonnanceLine[];
  onChange: (lines: OrdonnanceLine[]) => void;
  disabled?: boolean;
}

/**
 * Constructeur d'ordonnance de sortie — liste dynamique de médicaments.
 * Appeler JSON.stringify(lines) avant d'envoyer la valeur à l'API.
 */
export function OrdonnanceSortieBuilder({
  value,
  onChange,
  disabled = false,
}: OrdonnanceSortieBuilderProps) {
  const addLine = () => {
    onChange([...value, { medicament: '', posologie: '', duree: '' }]);
  };

  const removeLine = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof OrdonnanceLine, text: string) => {
    const next = value.map((line, i) =>
      i === idx ? { ...line, [field]: text } : line,
    );
    onChange(next);
  };

  return (
    <View style={styles.root}>
      {value.length === 0 && (
        <Text style={styles.empty}>Aucun médicament ajouté</Text>
      )}

      {value.map((line, idx) => (
        <View key={idx} style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineNum}>#{idx + 1}</Text>
            {!disabled && (
              <TouchableOpacity onPress={() => removeLine(idx)} activeOpacity={0.75}>
                <Text style={styles.removeBtn}>✕ Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>

          <FieldInput
            label="Médicament *"
            value={line.medicament}
            onChangeText={v => updateLine(idx, 'medicament', v)}
            placeholder="Ex: Amoxicilline 1g"
            disabled={disabled}
          />
          <FieldInput
            label="Posologie *"
            value={line.posologie}
            onChangeText={v => updateLine(idx, 'posologie', v)}
            placeholder="Ex: 1 comprimé matin, midi, soir"
            disabled={disabled}
          />
          <FieldInput
            label="Durée"
            value={line.duree}
            onChangeText={v => updateLine(idx, 'duree', v)}
            placeholder="Ex: 7 jours"
            disabled={disabled}
          />
        </View>
      ))}

      {!disabled && (
        <TouchableOpacity style={styles.addBtn} onPress={addLine} activeOpacity={0.75}>
          <Text style={styles.addBtnText}>+ Ajouter un médicament</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <View style={{ marginBottom: spacing.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && styles.disabledInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={LUNA_COLORS.textDisabled}
        editable={!disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: spacing.sm },
  empty: {
    textAlign: 'center',
    color: LUNA_COLORS.textSecondary,
    fontSize: fontSize.sm,
    paddingVertical: spacing.md,
  },
  lineCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, // ✨
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lineNum: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as any, color: LUNA_COLORS.tertiary },
  removeBtn: { fontSize: fontSize.xs, color: LUNA_COLORS.error },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold as any,
    color: LUNA_COLORS.textSecondary,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput, // ✨
    borderRadius: borderRadius.md, // ✨
    backgroundColor: LUNA_COLORS.inputBg, // ✨
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
  },
  disabledInput: { backgroundColor: LUNA_COLORS.background, color: LUNA_COLORS.textDisabled },
  addBtn: {
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: LUNA_COLORS.infoLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.secondary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: { color: LUNA_COLORS.tertiary, fontWeight: fontWeight.semibold as any, fontSize: fontSize.sm },
});
