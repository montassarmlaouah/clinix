import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { apiPost } from '@/src/api/client';
import { CONSTANTES } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ConstantesFormProps {
  patientId:   number | string;
  infirmierId: number | string;
  onSuccess?:  () => void;
  onCancel?:   () => void;
}

type FormKey =
  | 'tensionSystolique'
  | 'tensionDiastolique'
  | 'frequenceCardiaque'
  | 'temperature'
  | 'saturationOxygene'
  | 'poids';

type Status = 'none' | 'normal' | 'attention' | 'alerte';

interface FieldDef {
  key:        FormKey;
  label:      string;
  unit:       string;
  normalMin:  number;
  normalMax:  number;
  attenMin:   number;
  attenMax:   number;
  hasBadge:   boolean;
}

// ── Définitions des champs ────────────────────────────────────────────────────
const FIELDS: FieldDef[] = [
  {
    key: 'tensionSystolique',
    label: 'Tension systolique',
    unit: 'mmHg',
    normalMin: 90,  normalMax: 140,
    attenMin:  70,  attenMax:  170,
    hasBadge: true,
  },
  {
    key: 'tensionDiastolique',
    label: 'Tension diastolique',
    unit: 'mmHg',
    normalMin: 60,  normalMax: 90,
    attenMin:  40,  attenMax:  110,
    hasBadge: true,
  },
  {
    key: 'frequenceCardiaque',
    label: 'Fréquence cardiaque',
    unit: 'bpm',
    normalMin: 60,  normalMax: 100,
    attenMin:  40,  attenMax:  140,
    hasBadge: true,
  },
  {
    key: 'temperature',
    label: 'Température',
    unit: '°C',
    normalMin: 36,  normalMax: 37.5,
    attenMin:  35,  attenMax:  38.5,
    hasBadge: true,
  },
  {
    key: 'saturationOxygene',
    label: 'Saturation O₂ (SpO₂)',
    unit: '%',
    normalMin: 95,  normalMax: 100,
    attenMin:  90,  attenMax:  94.9,
    hasBadge: true,
  },
  {
    key: 'poids',
    label: 'Poids',
    unit: 'kg',
    normalMin: -1,       normalMax: Infinity,
    attenMin:  -1,       attenMax:  Infinity,
    hasBadge: false,
  },
];

// ── Logique de statut ─────────────────────────────────────────────────────────
function getStatus(value: string, f: FieldDef): Status {
  if (!f.hasBadge) return 'none';
  const v = parseFloat(value.replace(',', '.'));
  if (!value || isNaN(v)) return 'none';
  if (v >= f.normalMin && v <= f.normalMax) return 'normal';
  if (v >= f.attenMin  && v <= f.attenMax)  return 'attention';
  return 'alerte';
}

const STATUS_CONFIG: Record<Exclude<Status, 'none'>, { color: string; bg: string; label: string; icon: string }> = {
  normal:    { color: LUNA_COLORS.success, bg: LUNA_COLORS.successLight, label: 'Normal',    icon: 'checkmark-circle-outline' },
  attention: { color: LUNA_COLORS.warning, bg: LUNA_COLORS.warningLight, label: 'Attention', icon: 'warning-outline'           },
  alerte:    { color: LUNA_COLORS.error,   bg: LUNA_COLORS.errorLight,   label: 'Alerte',    icon: 'alert-circle-outline'      },
};

type FormValues = Record<FormKey, string>;
type FormErrors = Partial<Record<FormKey, string>>;

const EMPTY_VALUES: FormValues = {
  tensionSystolique:   '',
  tensionDiastolique:  '',
  frequenceCardiaque:  '',
  temperature:         '',
  saturationOxygene:   '',
  poids:               '',
};

// ── Composant ─────────────────────────────────────────────────────────────────
export function ConstantesForm({
  patientId,
  infirmierId,
  onSuccess,
  onCancel,
}: ConstantesFormProps): React.JSX.Element {
  const [values,     setValues]     = useState<FormValues>(EMPTY_VALUES);
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState('');

  const setValue = useCallback((key: FormKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev)  => ({ ...prev, [key]: undefined }));
    setApiError('');
  }, []);

  function validate(): boolean {
    const errs: FormErrors = {};
    // au moins un champ requis: tension syst/diast ou FC
    const required: FormKey[] = ['tensionSystolique', 'tensionDiastolique', 'frequenceCardiaque'];
    required.forEach((k) => {
      if (!values[k].trim()) errs[k] = 'Champ requis';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    try {
      const parse = (v: string) => (v.trim() ? parseFloat(v.replace(',', '.')) : undefined);
      // Envoi IDs en String (UUID) — Number() convertirait les UUID en NaN
      await apiPost(CONSTANTES.CREATE, {
        patientId:            String(patientId),
        infirmierId:          String(infirmierId),
        tensionSystolique:    parse(values.tensionSystolique),
        tensionDiastolique:   parse(values.tensionDiastolique),
        frequenceCardiaque:   parse(values.frequenceCardiaque),
        temperature:          parse(values.temperature),
        saturationOxygene:    parse(values.saturationOxygene),
        poids:                parse(values.poids),
      });
      onSuccess?.();
    } catch {
      setApiError('Erreur lors de l\'enregistrement. Vérifiez les valeurs et réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>Constantes vitales</Text>

      {FIELDS.map((field) => {
        const status = getStatus(values[field.key], field);
        const cfg    = status !== 'none' ? STATUS_CONFIG[status] : null;

        return (
          <View key={field.key} style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {cfg ? (
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as never} size={12} color={cfg.color} />
                  <Text style={[styles.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.inputRow, errors[field.key] && styles.inputRowError]}>
              <TextInput
                value={values[field.key]}
                onChangeText={(v) => setValue(field.key, v)}
                placeholder="—"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                style={styles.input}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitTxt}>{field.unit}</Text>
              </View>
            </View>
            {errors[field.key] ? (
              <Text style={styles.errorTxt}>{errors[field.key]}</Text>
            ) : null}
          </View>
        );
      })}

      {apiError ? (
        <View style={styles.apiErrorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={LUNA_COLORS.error} />
          <Text style={styles.apiErrorTxt}>{apiError}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {onCancel ? (
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.cancelTxt}>Annuler</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.btn,
            styles.submitBtn,
            submitting && styles.btnDisabled,
            pressed && { opacity: 0.75 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={LUNA_COLORS.textInverse} />
          ) : (
            <>
              <Ionicons name="save-outline" size={16} color={LUNA_COLORS.textInverse} />
              <Text style={styles.submitTxt}>Enregistrer les constantes</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.xxl, paddingBottom: 40 },
  sectionTitle:  { ...typography.sectionTitle, marginBottom: spacing.lg }, // ✨

  fieldCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg, // ✨
    padding:         spacing.md,
    marginBottom:    spacing.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle, // ✨
    ...(shadows.sm as object),
  },
  fieldHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    spacing.sm,
  },
  fieldLabel:  { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark },
  statusBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: spacing.sm,
    paddingVertical:   3,
    borderRadius:      borderRadius.full,
  },
  statusTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: LUNA_COLORS.inputBg, // ✨
    borderRadius:    borderRadius.md, // ✨
    borderWidth:     1.5,
    borderColor:     LUNA_COLORS.borderInput, // ✨
    overflow:        'hidden',
  },
  inputRowError: { borderColor: LUNA_COLORS.error },
  input: {
    flex:              1,
    height:            44,
    paddingHorizontal: spacing.md,
    fontSize:          fontSize.base,
    color:             LUNA_COLORS.textPrimary,
  },
  unitBadge: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(197, 220, 234, 0.6)', // ✨
    paddingHorizontal: spacing.md,
    height:          44,
    justifyContent:  'center',
    minWidth:        60,
    alignItems:      'center',
  },
  unitTxt:  { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.tertiary },
  errorTxt: { fontSize: fontSize.xs, color: LUNA_COLORS.error, marginTop: spacing.xs },

  apiErrorBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    backgroundColor:   LUNA_COLORS.errorLight,
    borderRadius:      borderRadius.md,
    padding:           spacing.md,
    marginBottom:      spacing.md,
  },
  apiErrorTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.error, flex: 1 },

  actions:   { gap: spacing.md, marginTop: spacing.sm },
  btn: {
    height:          52,
    borderRadius:    borderRadius.md,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
    gap:             spacing.sm,
  },
  cancelBtn:   { backgroundColor: LUNA_COLORS.surfaceLight, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle }, // ✨
  submitBtn:   { backgroundColor: LUNA_COLORS.secondary, ...(shadows.button as object) },
  btnDisabled: { opacity: 0.6 },
  cancelTxt:   { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark },
  submitTxt:   { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textInverse },
});
