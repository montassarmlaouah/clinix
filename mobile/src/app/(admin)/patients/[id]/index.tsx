import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { patientService, type Patient } from '@/src/api/services/patient.service';
import { LoadingOverlay } from '@/src/components/common';
import { LunaCard } from '@/src/components/common/LunaCard';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function AdminPatientDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const p = await patientService.getPatient(id);
      setPatient(p);
    } catch {
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Fiche patient" subtitle={patient ? `${patient.prenom} ${patient.nom}` : ''} />
      <ScrollView contentContainerStyle={styles.body}>
        {patient ? (
          <>
            <LunaCard>
              <Text style={styles.label}>Téléphone</Text>
              <Text style={styles.value}>{patient.telephone}</Text>
              {patient.email ? (
                <>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{patient.email}</Text>
                </>
              ) : null}
              {patient.dateNaissance ? (
                <>
                  <Text style={styles.label}>Naissance</Text>
                  <Text style={styles.value}>{patient.dateNaissance}</Text>
                </>
              ) : null}
              {patient.adresse ? (
                <>
                  <Text style={styles.label}>Adresse</Text>
                  <Text style={styles.value}>{patient.adresse}</Text>
                </>
              ) : null}
            </LunaCard>
            <Pressable
              style={styles.btn}
              onPress={() => router.push(`/(admin)/patients/${id}/dossier` as never)}
            >
              <Text style={styles.btnText}>Voir le dossier médical</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.err}>Patient introuvable.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  // ✨ ScrollView — paddingBottom tab bar
  body: { padding: spacing.lg, paddingBottom: 80 },
  label: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: spacing.sm },
  value: { fontSize: fontSize.md, color: LUNA_COLORS.darkest, fontWeight: fontWeight.medium },
  btn: {
    backgroundColor: LUNA_COLORS.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  err: { color: LUNA_COLORS.error, textAlign: 'center' },
});
