import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { IMAGERIES, MEDECINS } from '@/src/api/endpoints';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Imagerie {
  id: string | number;
  type?: string;
  statut?: string;
  motif?: string;
  patient?: { nom?: string; prenom?: string };
}

export default function MedecinExamensHub(): React.JSX.Element {
  const medecinId = useAuthStore((s) => s.userId);
  const [liste, setListe] = useState<Imagerie[]>([]);
  const [patients, setPatients] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('RADIO');
  const [motif, setMotif] = useState('');
  const [indications, setIndications] = useState('');
  const [questions, setQuestions] = useState('');
  const [niveauUrgence, setNiveauUrgence] = useState('NORMALE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!medecinId) return;
    if (!silent) setLoading(true);
    try {
      const [examens, pts] = await Promise.all([
        apiGet<Imagerie[]>(IMAGERIES.BY_MEDECIN(medecinId)),
        apiGet<{ id: string; nom: string; prenom: string }[]>(MEDECINS.PATIENTS_LIST(medecinId)),
      ]);
      setListe(examens ?? []);
      setPatients(pts ?? []);
    } catch { setListe([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => { load(); }, [load]);

  async function demander() {
    if (!patientId || !medecinId) return;
    try {
      await apiPost(IMAGERIES.DEMANDER, {
        patientId,
        medecinId,
        type,
        motif,
        indicationsCliniques: indications || undefined,
        questionsMedecin: questions || undefined,
        niveauUrgence,
      });
      setMotif('');
      setIndications('');
      setQuestions('');
      load(true);
    } catch { /* ignore */ }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Examens imagerie" subtitle="Demandes radiologiques" />
      <View style={styles.form}>
        <Text style={styles.label}>Patient (ID)</Text>
        <TextInput style={styles.input} value={patientId} onChangeText={setPatientId} placeholder="ID patient" />
        {patients.length > 0 ? (
          <View style={styles.chips}>
            {patients.slice(0, 5).map((p) => (
              <Pressable key={p.id} style={styles.chip} onPress={() => setPatientId(String(p.id))}>
                <Text style={styles.chipText}>{p.prenom} {p.nom}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <TextInput style={styles.input} value={motif} onChangeText={setMotif} placeholder="Motif" />
        <Pressable style={styles.btn} onPress={demander}>
          <Text style={styles.btnText}>Demander un examen</Text>
        </Pressable>
      </View>
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.type ?? 'Examen'}</Text>
            <Text style={styles.meta}>
              {item.patient?.prenom} {item.patient?.nom} — {item.statut}
            </Text>
            {item.motif ? <Text style={styles.meta}>{item.motif}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="flask-outline" title="Aucun examen" subtitle="" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  form: { padding: spacing.lg, gap: spacing.sm, backgroundColor: LUNA_COLORS.surface },
  label: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { backgroundColor: LUNA_COLORS.infoLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  chipActive: { backgroundColor: LUNA_COLORS.secondary },
  chipText: { fontSize: fontSize.xs, color: LUNA_COLORS.dark },
  chipTextActive: { color: LUNA_COLORS.textInverse },
  btn: { backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
