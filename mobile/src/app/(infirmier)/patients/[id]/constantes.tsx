// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiPost } from '@/src/api/client';
import { CONSTANTES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  icon: string;
  unit: string;
  keyboardType: 'numeric' | 'decimal-pad';
}

const FIELDS: FieldConfig[] = [
  { key: 'tensionSystolique', label: 'Tension systolique', placeholder: 'Ex : 120', icon: 'heart-outline', unit: 'mmHg', keyboardType: 'numeric' },
  { key: 'tensionDiastolique', label: 'Tension diastolique', placeholder: 'Ex : 80', icon: 'heart-outline', unit: 'mmHg', keyboardType: 'numeric' },
  { key: 'pouls', label: 'Pouls', placeholder: 'Ex : 72', icon: 'pulse-outline', unit: 'bpm', keyboardType: 'numeric' },
  { key: 'spo2', label: 'SpO2', placeholder: 'Ex : 98', icon: 'pulse-outline', unit: '%', keyboardType: 'numeric' },
  { key: 'temperature', label: 'Température', placeholder: 'Ex : 37.2', icon: 'thermometer-outline', unit: '°C', keyboardType: 'decimal-pad' },
  { key: 'glycemie', label: 'Glycémie', placeholder: 'Ex : 1.0', icon: 'water-outline', unit: 'g/L', keyboardType: 'decimal-pad' },
];

export default function ConstantesScreen() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const { userId, cliniqueId } = useAuthStore();

  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
  };

  const handleSubmit = async () => {
    if (!userId || !patientId) return;

    const parsed: Record<string, number> = {};
    for (const field of FIELDS) {
      const val = values[field.key]?.trim();
      if (val) {
        const num = parseFloat(val);
        if (isNaN(num)) {
          Alert.alert('Erreur', `Valeur invalide pour ${field.label}`);
          return;
        }
        parsed[field.key] = num;
      }
    }

    if (Object.keys(parsed).length === 0) {
      Alert.alert('Champ requis', 'Veuillez saisir au moins une constante vitale.');
      return;
    }

    setSaving(true);
    try {
      await apiPost(CONSTANTES.CREATE, {
        patientId,
        infirmierId: String(userId),
        ...parsed,
        organisationId: cliniqueId ?? undefined,
      });
      Alert.alert('Succès', 'Constantes vitales enregistrées.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer les constantes vitales.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Constantes vitales</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={LUNA_COLORS.secondary} />
            <Text style={styles.infoText}>Remplissez les champs souhaités puis validez.</Text>
          </View>

          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputWrap}>
                  <Ionicons name={field.icon as never} size={18} color={LUNA_COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={values[field.key] ?? ''}
                    onChangeText={(text) => handleChange(field.key, text)}
                    placeholder={field.placeholder}
                    placeholderTextColor={LUNA_COLORS.textDisabled}
                    keyboardType={field.keyboardType}
                  />
                </View>
                <Text style={styles.unit}>{field.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.btnSubmit, saving && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          )}
          <Text style={styles.btnSubmitText}>
            {saving ? 'Enregistrement…' : 'Enregistrer les constantes'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨
    backgroundColor: LUNA_COLORS.surface,
  },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },

  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },

  formCard: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: LUNA_COLORS.border,
    gap: spacing.md,
  },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  infoText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, flex: 1 },

  fieldGroup: { gap: 4 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.textSecondary, marginBottom: 4 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, // ✨
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: LUNA_COLORS.borderInput, paddingHorizontal: spacing.sm,
  }, // ✨
  inputIcon: { marginRight: spacing.xs }, // ✨
  input: {
    flex: 1, paddingVertical: spacing.sm, fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  }, // ✨
  unit: { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled, width: 40, textAlign: 'right' },

  btnSubmit: {
    flexDirection: 'row', minHeight: 48,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  }, // ✨
  btnDisabled: { opacity: 0.6 },
  btnSubmitText: { color: '#fff', fontSize: fontSize.base, fontWeight: fontWeight.bold },
});