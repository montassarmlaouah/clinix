import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import {
  PATIENTS,
  DOSSIERS,
  CONSULTATIONS,
  IMAGERIES,
  ORDONNANCES,
} from '@/src/api/endpoints';
import { patientService, type Patient } from '@/src/api/services/patient.service';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Small UI components ───────────────────────────────────────────────────────
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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function DossierMedicalScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [dossier, setDossier] = useState<DossierMedical | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [ordonnances, setOrdonnances]     = useState<Ordonnance[]>([]);
  const [examens, setExamens]             = useState<Imagerie[]>([]);
  const [loading, setLoading]     = useState(true);
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

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
        <Text style={styles.loadingText}>Chargement du dossier…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {/* Patient header */}
        <View style={styles.header}>
          <Ionicons name="folder-open-outline" size={28} color={LUNA_COLORS.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>
              {patient ? `${patient.prenom} ${patient.nom}` : 'Dossier médical'}
            </Text>
            <Text style={styles.headerSub}>Lecture seule — Secrétaire</Text>
          </View>
        </View>

        {/* Antécédents & Allergies */}
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

        {/* Consultations */}
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
                {c.diagnostic && <Text style={styles.itemBody}>Diagnostic : {c.diagnostic}</Text>}
                {c.observations && <Text style={styles.itemBody}>Obs. : {c.observations}</Text>}
              </View>
            ))
          )}
        </Section>

        {/* Ordonnances */}
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
                  <Text key={i} style={styles.itemBody}>• {m.nom} {m.posologie ? `(${m.posologie})` : ''}</Text>
                ))}
              </View>
            ))
          )}
        </Section>

        {/* Examens */}
        <Section title={`Examens complémentaires (${examens.length})`}>
          {examens.length === 0 ? (
            <Empty text="Aucun examen" />
          ) : (
            examens.map((e) => (
              <View key={e.id} style={styles.itemCard}>
                <Text style={styles.itemDate}>
                  {e.date ? new Date(e.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </Text>
                <Text style={styles.itemTitle}>{e.type ?? 'Imagerie'} — {e.statut ?? 'En cours'}</Text>
                {e.fichier && <Text style={styles.itemBody}>Fichier : {e.fichier}</Text>}
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: LUNA_COLORS.background },
  scroll:    { flex: 1 },
  content:   { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText:{ color: LUNA_COLORS.textSecondary, fontSize: fontSize.sm },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...({ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } as object),
  },
  headerName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  headerSub:  { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },

  section: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...({ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } as object),
  },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary, textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  paragraph: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, lineHeight: 20 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: {
    backgroundColor: LUNA_COLORS.errorLight ?? LUNA_COLORS.error + '11',
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  tagText: { fontSize: fontSize.xs, color: LUNA_COLORS.error, fontWeight: fontWeight.medium },

  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, opacity: 0.7,
  },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled },

  itemCard: {
    borderLeftWidth: 3, borderLeftColor: LUNA_COLORS.secondary,
    backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.sm,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  itemDate: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled, marginBottom: 2 },
  itemTitle:{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  itemBody: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 2 },
  itemMeta: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2, fontStyle: 'italic' },
});
