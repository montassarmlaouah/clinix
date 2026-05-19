import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { patientService } from '@/src/api/services/patient.service';
import { Button } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Props {
  afterCreateRoute?: (patientId: string) => string;
}

export function NewPatientScreen({ afterCreateRoute }: Props): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [sexe, setSexe] = useState<'HOMME' | 'FEMME'>('HOMME');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!cliniqueId || !nom.trim() || !prenom.trim() || !telephone.trim()) {
      Alert.alert('Erreur', 'Nom, prénom, téléphone et clinique requis.');
      return;
    }
    setLoading(true);
    try {
      const p = await patientService.createPatient({
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.replace(/\s/g, ''),
        dateNaissance: dateNaissance || undefined,
        sexe,
        cliniqueId,
        typeAdmission: 'EXTERNE',
      });
      if (afterCreateRoute && p.id) {
        router.replace(afterCreateRoute(String(p.id)) as never);
      } else {
        router.back();
      }
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Nouveau patient" />
      <ScrollView contentContainerStyle={styles.form}>
        <Field label="Nom" value={nom} onChangeText={setNom} />
        <Field label="Prénom" value={prenom} onChangeText={setPrenom} />
        <Field label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
        <Field label="Date naissance (AAAA-MM-JJ)" value={dateNaissance} onChangeText={setDateNaissance} />
        <View style={styles.sexeRow}>
          {(['HOMME', 'FEMME'] as const).map((s) => (
            <Text
              key={s}
              style={[styles.sexeBtn, sexe === s && styles.sexeActive]}
              onPress={() => setSexe(s)}
            >
              {s}
            </Text>
          ))}
        </View>
        <Button title="Enregistrer" onPress={submit} loading={loading} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.xxl, gap: spacing.md, paddingBottom: 80 }, // ✨ espace tab bar
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark },
  input: {
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond input HeroUI
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  sexeRow: { flexDirection: 'row', gap: spacing.sm },
  sexeBtn: {
    flex: 1,
    textAlign: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    color: LUNA_COLORS.textPrimary,
  },
  sexeActive: { backgroundColor: LUNA_COLORS.secondary, color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
});
