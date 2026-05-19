import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import {
  PATIENTS,
  CONSULTATIONS,
  ORDONNANCES,
  CONSTANTES,
  IMAGERIES,
  DEMANDES_OPERATION,
} from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PatientDetail {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  chambre?: string;
  motifHospitalisation?: string;
  antecedents?: string;
  allergies?: string;
  telephone?: string;
}

interface Constante {
  dateHeure: string;
  tensionSystolique?: number;
  tensionDiastolique?: number;
  pouls?: number;
  spo2?: number;
  temperature?: number;
  glycemie?: number;
}

type TabKey = 'resume' | 'consultations' | 'ordonnances' | 'examens' | 'operations' | 'constantes';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'resume', label: 'Résumé', icon: 'document-text-outline' },
  { key: 'consultations', label: 'Consultations', icon: 'calendar-outline' },
  { key: 'ordonnances', label: 'Ordonnances', icon: 'medical-outline' },
  { key: 'examens', label: 'Examens', icon: 'flask-outline' },
  { key: 'operations', label: 'Opérations', icon: 'cut-outline' },
  { key: 'constantes', label: 'Constantes', icon: 'pulse-outline' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAge(dateNaissance?: string): number | null {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

// ── Écran Patient Détail Médecin ──────────────────────────────────────────────
export default function PatientDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const medecinId = useAuthStore((s) => s.userId);

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [constantes, setConstantes] = useState<Constante[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('resume');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatient = useCallback(async () => {
    if (!id) return;
    try {
      const p = await apiGet<PatientDetail>(PATIENTS.BY_ID(id));
      setPatient(p);
    } catch { /* ignore */ }
  }, [id]);

  const loadConstantes = useCallback(async () => {
    if (!id) return;
    try {
      const c = await apiGet<Constante[]>(CONSTANTES.BY_PATIENT(id));
      setConstantes(c);
    } catch { /* ignore */ }
  }, [id]);

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await Promise.all([loadPatient(), loadConstantes()]);
    setLoading(false);
    setRefreshing(false);
  }, [id, loadPatient, loadConstantes]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) return <LoadingOverlay />;
  if (!patient) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="alert-circle-outline" title="Patient introuvable" subtitle="" />
      </SafeAreaView>
    );
  }

  const age = getAge(patient.dateNaissance);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{patient.prenom} {patient.nom}</Text>
          {age != null && <Text style={styles.headerMeta}>{age} ans — Ch. {patient.chambre ?? '—'}</Text>}
        </View>
        <Pressable
          onPress={() => router.push(`/(medecin)/patients/${id}/consultation` as never)}
          style={styles.fabHeader}
        >
          <Ionicons name="add-circle" size={28} color={LUNA_COLORS.secondary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tab, active && styles.tabActive]}>
              <Ionicons name={t.icon} size={16} color={active ? LUNA_COLORS.secondary : LUNA_COLORS.textSecondary} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} />}
        contentContainerStyle={styles.content}
      >
        {activeTab === 'resume' && (
          <ResumeTab patient={patient} constantes={constantes} />
        )}
        {activeTab === 'consultations' && (
          <ConsultationsTab patientId={id} />
        )}
        {activeTab === 'ordonnances' && (
          <OrdonnancesTab patientId={id} />
        )}
        {activeTab === 'examens' && (
          <ExamensTab patientId={id} />
        )}
        {activeTab === 'operations' && (
          <OperationsTab patientId={id} />
        )}
        {activeTab === 'constantes' && (
          <ConstantesTab patientId={id} constantes={constantes} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Tab Résumé ────────────────────────────────────────────────────────────────
function ResumeTab({ patient, constantes }: { patient: PatientDetail; constantes: Constante[] }) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const latest = constantes[0];

  return (
    <View style={styles.tabPanel}>
      <CardRow label="Motif d'admission" value={patient.motifHospitalisation ?? '—'} />
      <CardRow label="Antécédents" value={patient.antecedents ?? '—'} />
      <CardRow label="Allergies" value={patient.allergies ?? '—'} />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Constantes du jour</Text>
        <Pressable onPress={() => router.push(`/(medecin)/patients/${id}/constantes` as never)}>
          <Text style={styles.link}>Voir historique</Text>
        </Pressable>
      </View>
      {latest ? (
        <View style={styles.constantesGrid}>
          <ConstanteBadge label="TA" value={`${latest.tensionSystolique ?? '—'}/${latest.tensionDiastolique ?? '—'}`} />
          <ConstanteBadge label="Pouls" value={`${latest.pouls ?? '—'} bpm`} />
          <ConstanteBadge label="SpO₂" value={`${latest.spo2 ?? '—'} %`} />
          <ConstanteBadge label="Temp" value={`${latest.temperature ?? '—'} °C`} />
          <ConstanteBadge label="Glycémie" value={`${latest.glycemie ?? '—'}`} />
        </View>
      ) : (
        <Text style={styles.emptyText}>Aucune constante enregistrée</Text>
      )}
    </View>
  );
}

// ── Tab Consultations ─────────────────────────────────────────────────────────
function ConsultationsTab({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any[]>(CONSULTATIONS.BY_PATIENT(patientId))
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabPanel}>
      <Pressable
        style={styles.actionBtn}
        onPress={() => router.push(`/(medecin)/patients/${patientId}/consultation` as never)}
      >
        <Ionicons name="add-circle-outline" size={18} color={LUNA_COLORS.textInverse} />
        <Text style={styles.actionBtnText}>Nouvelle consultation</Text>
      </Pressable>
      {items.map((c) => (
        <View key={c.id} style={styles.listCard}>
          <Text style={styles.listTitle}>{c.motif ?? 'Consultation'}</Text>
          <Text style={styles.listDate}>{new Date(c.date).toLocaleDateString('fr-FR')}</Text>
        </View>
      ))}
      {items.length === 0 && <Text style={styles.emptyText}>Aucune consultation</Text>}
    </View>
  );
}

// ── Tab Ordonnances ───────────────────────────────────────────────────────────
function OrdonnancesTab({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);

  useEffect(() => {
    apiGet<any[]>(ORDONNANCES.BY_PATIENT(patientId))
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  async function handleSign(id: string) {
    setSigningId(id);
    try {
      await apiPatch(`${ORDONNANCES.SIGNER(id)}`, {});
      setItems((prev) => prev.map((o) => o.id === id ? { ...o, signee: true } : o));
    } catch { /* ignore */ }
    setSigningId(null);
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabPanel}>
      <Pressable
        style={styles.actionBtn}
        onPress={() => router.push(`/(medecin)/patients/${patientId}/ordonnance` as never)}
      >
        <Ionicons name="add-circle-outline" size={18} color={LUNA_COLORS.textInverse} />
        <Text style={styles.actionBtnText}>Créer ordonnance</Text>
      </Pressable>
      {items.map((o) => (
        <View key={o.id} style={styles.listCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.listTitle}>{o.titre ?? `Ordonnance #${o.id}`}</Text>
            {o.signee ? (
              <View style={styles.signedBadge}>
                <Text style={styles.signedText}>Signée</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleSign(o.id)}
                disabled={signingId === o.id}
                style={[styles.signBtn, signingId === o.id && { opacity: 0.6 }]}
              >
                <Text style={styles.signBtnText}>{signingId === o.id ? '…' : 'Signer'}</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.listDate}>{new Date(o.date).toLocaleDateString('fr-FR')}</Text>
        </View>
      ))}
      {items.length === 0 && <Text style={styles.emptyText}>Aucune ordonnance</Text>}
    </View>
  );
}

// ── Tab Examens ───────────────────────────────────────────────────────────────
function ExamensTab({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any[]>(IMAGERIES.BY_PATIENT(patientId))
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabPanel}>
      {items.map((e) => (
        <View key={e.id} style={styles.listCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.listTitle}>{e.type ?? e.libelle ?? 'Examen'}</Text>
            {e.type === 'IMAGERIE' && (e.statut === 'RESULTAT_DISPO' || e.statut === 'VALIDE') && (
              <Pressable
                style={styles.rapportBtn}
                onPress={() => router.push(`/(medecin)/patients/${patientId}/rapport/${e.id}` as never)}
              >
                <Text style={styles.rapportBtnText}>Voir le rapport</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.listDate}>{new Date(e.datePrescription).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.listStatus}>{e.statut}</Text>
        </View>
      ))}
      {items.length === 0 && <Text style={styles.emptyText}>Aucun examen</Text>}
    </View>
  );
}

// ── Tab Opérations ────────────────────────────────────────────────────────────
function OperationsTab({ patientId }: { patientId: string }) {
  const router = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!medecinId) return;
    apiGet<any[]>(`${DEMANDES_OPERATION.LIST}?demandeurId=${medecinId}${cliniqueId ? `&cliniqueId=${cliniqueId}` : ''}`)
      .then((data) => setItems(data.filter((o) => String(o.patientId) === patientId)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId, medecinId, cliniqueId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabPanel}>
      <Pressable
        style={styles.actionBtn}
        onPress={() => router.push(`/(medecin)/operations/nouveau?patientId=${patientId}` as never)}
      >
        <Ionicons name="add-circle-outline" size={18} color={LUNA_COLORS.textInverse} />
        <Text style={styles.actionBtnText}>Nouvelle demande</Text>
      </Pressable>
      {items.map((o) => (
        <Pressable
          key={o.id}
          style={styles.listCard}
          onPress={() => router.push(`/(medecin)/operations/${o.id}` as never)}
        >
          <Text style={styles.listTitle}>{o.typeOperation ?? 'Opération'}</Text>
          <Text style={styles.listDate}>{o.datePrevue ? new Date(o.datePrevue).toLocaleDateString('fr-FR') : '—'}</Text>
          <Text style={styles.listStatus}>{o.statut}</Text>
        </Pressable>
      ))}
      {items.length === 0 && <Text style={styles.emptyText}>Aucune opération</Text>}
    </View>
  );
}

// ── Tab Constantes ────────────────────────────────────────────────────────────
function ConstantesTab({ patientId, constantes }: { patientId: string; constantes: Constante[] }) {
  const router = useRouter();
  return (
    <View style={styles.tabPanel}>
      <Pressable
        style={styles.actionBtn}
        onPress={() => router.push(`/(medecin)/patients/${patientId}/constantes` as never)}
      >
        <Ionicons name="add-circle-outline" size={18} color={LUNA_COLORS.textInverse} />
        <Text style={styles.actionBtnText}>Voir graphique détaillé</Text>
      </Pressable>
      {constantes.map((c, i) => (
        <View key={i} style={styles.listCard}>
          <Text style={styles.listDate}>{new Date(c.dateHeure).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.listTitle}>
            TA {c.tensionSystolique ?? '—'}/{c.tensionDiastolique ?? '—'} — ♥ {c.pouls ?? '—'} — SpO₂ {c.spo2 ?? '—'}%
          </Text>
        </View>
      ))}
      {constantes.length === 0 && <Text style={styles.emptyText}>Aucune constante</Text>}
    </View>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function CardRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cardRow}>
      <Text style={styles.cardRowLabel}>{label}</Text>
      <Text style={styles.cardRowValue}>{value}</Text>
    </View>
  );
}

function ConstanteBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.constanteBadge}>
      <Text style={styles.constanteBadgeLabel}>{label}</Text>
      <Text style={styles.constanteBadgeValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    gap: spacing.sm,
    ...(shadows.sm as object),
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1 },
  headerName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  headerMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  fabHeader: { padding: spacing.xs },
  tabBar: {
    flexGrow: 0,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨ séparateur subtil
  },
  tabContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  tabActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  tabLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  tabLabelActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  content: { padding: spacing.lg, paddingBottom: 80 },
  tabPanel: { gap: spacing.md },
  cardRow: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...(shadows.sm as object),
  }, // ✨
  cardRowLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.tertiary },
  cardRowValue: { fontSize: fontSize.base, color: LUNA_COLORS.darkest },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  sectionTitle: {
    ...typography.sectionTitle,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  }, // ✨
  link: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  constantesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...(shadows.sm as object),
  },
  constanteBadge: {
    backgroundColor: LUNA_COLORS.infoLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 70,
    alignItems: 'center',
  },
  constanteBadgeLabel: { fontSize: 10, color: LUNA_COLORS.tertiary, fontWeight: fontWeight.bold },
  constanteBadgeValue: { fontSize: fontSize.sm, color: LUNA_COLORS.dark, fontWeight: fontWeight.semibold },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
  actionBtn: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  }, // ✨
  actionBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textInverse },
  listCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    ...(shadows.sm as object),
  },
  listTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  listDate: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  listStatus: { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
  rapportBtn: { backgroundColor: LUNA_COLORS.infoLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  rapportBtnText: { fontSize: fontSize.xs, color: LUNA_COLORS.info, fontWeight: fontWeight.semibold },
  signedBadge: {
    backgroundColor: LUNA_COLORS.successLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  signedText: { fontSize: fontSize.xs, color: LUNA_COLORS.success, fontWeight: fontWeight.bold },
  signBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  }, // ✨
  signBtnText: { fontSize: fontSize.xs, color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
});
