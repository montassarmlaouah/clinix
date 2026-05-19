import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { CONSULTATIONS, DOSSIERS, IMAGERIES, ORDONNANCES } from '@/src/api/endpoints';
import { patientService, type Patient } from '@/src/api/services/patient.service';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface PatientDossierMedicalScreenProps {
  subtitle?: string;
}

interface DossierMedical {
  id: string;
  antecedents?: string;
  allergies?: string[];
}

interface Consultation {
  id: string;
  date?: string;
  motif?: string;
  diagnostic?: string;
  observations?: string;
}

interface Ordonnance {
  id: string;
  date?: string;
  statut?: string;
  medicaments?: { nom: string; posologie?: string }[];
}

interface Imagerie {
  id: string;
  type?: string;
  statut?: string;
  fichier?: string;
  date?: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Empty({ text = 'Aucune donnée' }: { text?: string }) {
  return (
    <View style={styles.emptyBox}>
      <Ionicons name="document-text-outline" size={20} color={LUNA_COLORS.textDisabled} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function PatientDossierMedicalScreen({
  subtitle = 'Dossier médical',
}: PatientDossierMedicalScreenProps): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dossier, setDossier] = useState<DossierMedical | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [examens, setExamens] = useState<Imagerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [p, dm, c, o, e] = await Promise.all([
        patientService.getPatient(id).catch(() => null),
        apiGet<DossierMedical>(DOSSIERS.BY_PATIENT(id)).catch(() => null),
        apiGet<Consultation[]>(CONSULTATIONS.BY_PATIENT(id)).catch(() => []),
        apiGet<Ordonnance[]>(ORDONNANCES.BY_PATIENT(id)).catch(() => []),
        apiGet<Imagerie[]>(IMAGERIES.BY_PATIENT(id)).catch(() => []),
      ]);
      setPatient(p);
      setDossier(dm);
      setConsultations(c ?? []);
      setOrdonnances(o ?? []);
      setExamens(e ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
        <Text style={styles.loadingText}>Chargement du dossier…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Dossier médical"
        subtitle={patient ? `${patient.prenom} ${patient.nom}` : subtitle}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <Section title="Antécédents & Allergies">
          {dossier?.antecedents ? (
            <Text style={styles.paragraph}>{dossier.antecedents}</Text>
          ) : (
            <Empty text="Aucun antécédent renseigné" />
          )}
          {dossier?.allergies && dossier.allergies.length > 0 ? (
            <View style={styles.tagRow}>
              {dossier.allergies.map((a, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{a}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Empty text="Aucune allergie renseignée" />
          )}
        </Section>

        <Section title={`Consultations (${consultations.length})`}>
          {consultations.length === 0 ? (
            <Empty text="Aucune consultation" />
          ) : (
            consultations.map((c) => (
              <View key={c.id} style={styles.itemCard}>
                <Text style={styles.itemDate}>
                  {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Text>
                <Text style={styles.itemTitle}>{c.motif ?? 'Consultation'}</Text>
                {c.diagnostic ? <Text style={styles.itemBody}>Diagnostic : {c.diagnostic}</Text> : null}
                {c.observations ? <Text style={styles.itemBody}>Obs. : {c.observations}</Text> : null}
              </View>
            ))
          )}
        </Section>

        <Section title={`Ordonnances (${ordonnances.length})`}>
          {ordonnances.length === 0 ? (
            <Empty text="Aucune ordonnance" />
          ) : (
            ordonnances.map((o) => (
              <View key={o.id} style={styles.itemCard}>
                <Text style={styles.itemDate}>
                  {o.date ? new Date(o.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Text>
                <Text style={styles.itemTitle}>Ordonnance — {o.statut ?? 'En cours'}</Text>
                {o.medicaments?.map((m, i) => (
                  <Text key={i} style={styles.itemBody}>
                    • {m.nom} {m.posologie ? `(${m.posologie})` : ''}
                  </Text>
                ))}
              </View>
            ))
          )}
        </Section>

        <Section title={`Examens (${examens.length})`}>
          {examens.length === 0 ? (
            <Empty text="Aucun examen" />
          ) : (
            examens.map((e) => (
              <View key={e.id} style={styles.itemCard}>
                <Text style={styles.itemDate}>
                  {e.date ? new Date(e.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Text>
                <Text style={styles.itemTitle}>
                  {e.type ?? 'Imagerie'} — {e.statut ?? 'En cours'}
                </Text>
                {e.fichier ? <Text style={styles.itemBody}>Fichier : {e.fichier}</Text> : null}
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 }, // ✨ espace tab bar
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: LUNA_COLORS.textSecondary, fontSize: fontSize.sm },
  section: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.md,
    ...(shadows.sm as object),
  },
  sectionTitle: {
    ...typography.sectionTitle, // ✨ titre section HeroUI
    marginBottom: spacing.sm,
  },
  paragraph: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: {
    backgroundColor: LUNA_COLORS.errorLight, // ✨ badge errorLight
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  tagText: { fontSize: fontSize.xs, color: LUNA_COLORS.error, fontWeight: fontWeight.medium },
  emptyBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, opacity: 0.7 },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled },
  itemCard: {
    borderLeftWidth: 3,
    borderLeftColor: LUNA_COLORS.secondary,
    backgroundColor: LUNA_COLORS.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemDate: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled, marginBottom: 2 },
  itemTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  itemBody: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 2 },
});
