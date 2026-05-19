import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import {
  PATIENTS,
  ADMINISTRATIONS,
  CONSTANTES,
  SURVEILLANCES,
} from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types — alignés avec le backend ───────────────────────────────────────────
interface PatientDetail {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  groupeSanguin?: string;
  numeroPatient?: string;
}

interface Constante {
  dateHeure: string;
  tension?: string;
  temperature?: number;
  frequenceCardiaque?: number;
  saturationOxygene?: number;
}

interface AdministrationTraitement {
  id: string;
  heureAdministration: string;
  typeTraitement: string;
  nomMedicament: string;
  dosage: string;
  voieAdministration: string;
  administre: boolean;
}

interface SurveillanceInfirmiere {
  id: string;
  heureObservation: string;
  tensionArterielleSystemique?: number;
  tensionArterielleDiastolique?: number;
  frequenceCardiaque?: number;
  frequenceRespiratoire?: number;
  saturationOxygene?: number;
  temperature?: number;
  observations?: string;
}

type TabKey = 'administrations' | 'constantes' | 'surveillances';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'administrations', label: 'Administrations', icon: 'bandage-outline' },
  { key: 'constantes', label: 'Constantes', icon: 'pulse-outline' },
  { key: 'surveillances', label: 'Surveillances', icon: 'heart-outline' },
];

export default function PatientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cliniqueId } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('administrations');

  const [administrations, setAdministrations] = useState<AdministrationTraitement[]>([]);
  const [constantes, setConstantes] = useState<Constante[]>([]);
  const [surveillances, setSurveillances] = useState<SurveillanceInfirmiere[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const p = await apiGet<PatientDetail>(PATIENTS.BY_ID(id));
      setPatient(p);

      const [adm, cst, surv] = await Promise.all([
        apiGet<AdministrationTraitement[]>(ADMINISTRATIONS.BY_PATIENT(id)).catch(() => []),
        apiGet<Constante[]>(CONSTANTES.BY_PATIENT(id)).catch(() => []),
        apiGet<SurveillanceInfirmiere[]>(SURVEILLANCES.BY_PATIENT(id)).catch(() => []),
      ]);
      setAdministrations(adm);
      setConstantes(cst);
      setSurveillances(surv);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingOverlay />;
  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState icon="alert-circle-outline" title="Patient introuvable" message="Vérifiez l'identifiant." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Header patient */}
        <View style={styles.headerCard}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.darkest} />
          </Pressable>
          <Text style={styles.patientName}>{patient.prenom} {patient.nom}</Text>
          <Text style={styles.patientMeta}>
            {patient.sexe ? `${patient.sexe} · ` : ''}
            {patient.dateNaissance ? `${patient.dateNaissance} · ` : ''}
            {patient.groupeSanguin ?? ''}
          </Text>
          {patient.numeroPatient && (
            <Text style={styles.patientNum}>N° {patient.numeroPatient}</Text>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={tab.icon} size={18} color={active ? LUNA_COLORS.surface : LUNA_COLORS.textSecondary} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content */}
        {activeTab === 'administrations' && (
          <AdministrationsPanel data={administrations} patientId={id} onRefresh={load} />
        )}
        {activeTab === 'constantes' && (
          <ConstantesPanel data={constantes} patientId={id} onRefresh={load} />
        )}
        {activeTab === 'surveillances' && (
          <SurveillancesPanel data={surveillances} patientId={id} onRefresh={load} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Panel Administrations ─────────────────────────────────────────────────────
function AdministrationsPanel({ data, patientId, onRefresh }: { data: AdministrationTraitement[]; patientId: string; onRefresh: () => void }) {
  if (data.length === 0) {
    return <EmptyState icon="bandage-outline" title="Aucune administration" message="Ce patient n'a pas de traitement planifié." />;
  }
  return (
    <View style={styles.panel}>
      {data.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.nomMedicament}</Text>
            <View style={[styles.badge, item.administre ? styles.badgeSuccess : styles.badgeWarning]}>
              <Text style={[styles.badgeText, item.administre ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                {item.administre ? 'Administré' : 'À faire'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>{item.dosage} · {item.voieAdministration}</Text>
          <Text style={styles.cardMeta}>{item.typeTraitement} · {item.heureAdministration}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Panel Constantes ──────────────────────────────────────────────────────────
function ConstantesPanel({ data }: { data: Constante[]; patientId: string; onRefresh: () => void }) {
  if (data.length === 0) {
    return <EmptyState icon="pulse-outline" title="Aucune constante" message="Ce patient n'a pas de constantes vitales enregistrées." />;
  }
  return (
    <View style={styles.panel}>
      {data.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.cardTitle}>{new Date(item.dateHeure).toLocaleString('fr-FR')}</Text>
          <View style={styles.grid2}>
            {item.tension && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Tension</Text>
                <Text style={styles.gridValue}>{item.tension}</Text>
              </View>
            )}
            {item.temperature != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Température</Text>
                <Text style={styles.gridValue}>{item.temperature} °C</Text>
              </View>
            )}
            {item.frequenceCardiaque != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>FC</Text>
                <Text style={styles.gridValue}>{item.frequenceCardiaque} bpm</Text>
              </View>
            )}
            {item.saturationOxygene != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>SpO2</Text>
                <Text style={styles.gridValue}>{item.saturationOxygene} %</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Panel Surveillances ───────────────────────────────────────────────────────
function SurveillancesPanel({ data }: { data: SurveillanceInfirmiere[]; patientId: string; onRefresh: () => void }) {
  if (data.length === 0) {
    return <EmptyState icon="heart-outline" title="Aucune surveillance" message="Ce patient n'a pas de surveillance infirmière enregistrée." />;
  }
  return (
    <View style={styles.panel}>
      {data.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{new Date(item.heureObservation).toLocaleString('fr-FR')}</Text>
          <View style={styles.grid2}>
            {item.tensionArterielleSystemique != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>TAS</Text>
                <Text style={styles.gridValue}>{item.tensionArterielleSystemique}</Text>
              </View>
            )}
            {item.tensionArterielleDiastolique != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>TAD</Text>
                <Text style={styles.gridValue}>{item.tensionArterielleDiastolique}</Text>
              </View>
            )}
            {item.frequenceCardiaque != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>FC</Text>
                <Text style={styles.gridValue}>{item.frequenceCardiaque} bpm</Text>
              </View>
            )}
            {item.frequenceRespiratoire != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>FR</Text>
                <Text style={styles.gridValue}>{item.frequenceRespiratoire} /min</Text>
              </View>
            )}
            {item.saturationOxygene != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>SpO2</Text>
                <Text style={styles.gridValue}>{item.saturationOxygene} %</Text>
              </View>
            )}
            {item.temperature != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Temp</Text>
                <Text style={styles.gridValue}>{item.temperature} °C</Text>
              </View>
            )}
          </View>
          {item.observations && (
            <Text style={styles.cardMeta}>Obs: {item.observations}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  headerCard: {
    margin: spacing.xl, padding: spacing.xl,
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  backBtn: { marginBottom: spacing.sm },
  patientName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  patientMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  patientNum: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled, marginTop: spacing.xs },
  tabsScroll: { marginBottom: spacing.md },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginLeft: spacing.xl, borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight, borderWidth: 1, borderColor: LUNA_COLORS.border,
  },
  tabActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  tabLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.medium },
  tabLabelActive: { color: LUNA_COLORS.surface },
  panel: { paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  }, // ✨
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  cardMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  badgeSuccess: { backgroundColor: LUNA_COLORS.successLight },
  badgeWarning: { backgroundColor: LUNA_COLORS.warningLight },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  badgeTextSuccess: { color: LUNA_COLORS.success },
  badgeTextWarning: { color: LUNA_COLORS.warning },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  gridItem: { width: '45%' },
  gridLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  gridValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
});
