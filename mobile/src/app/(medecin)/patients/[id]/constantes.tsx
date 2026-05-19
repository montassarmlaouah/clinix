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

import { apiGet } from '@/src/api/client';
import { CONSTANTES } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface ConstanteEntry {
  id: string;
  dateMesure: string;
  frequenceCardiaque?: number;
  tensionArterielle?: string;
  temperature?: number;
  saturationOxygene?: number;
  poids?: number;
  taille?: number;
  frequenceRespiratoire?: number;
  glycemie?: number;
  medecinNom?: string;
}

const VITAL_FIELDS: { key: keyof ConstanteEntry; label: string; unit: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'frequenceCardiaque', label: 'FC', unit: 'bpm', icon: 'heart-outline' },
  { key: 'tensionArterielle', label: 'TA', unit: 'mmHg', icon: 'pulse-outline' },
  { key: 'temperature', label: 'Temp.', unit: '\u00b0C', icon: 'thermometer-outline' },
  { key: 'saturationOxygene', label: 'SpO\u2082', unit: '%', icon: 'water-outline' },
  { key: 'poids', label: 'Poids', unit: 'kg', icon: 'scale-outline' },
  { key: 'frequenceRespiratoire', label: 'FR', unit: '/min', icon: 'fitness-outline' },
  { key: 'glycemie', label: 'Glyc\u00e9mie', unit: 'g/L', icon: 'analytics-outline' },
];

export default function ConstantesScreen() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();

  const [constantes, setConstantes] = useState<ConstanteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!patientId) return;
    try {
      if (!silent) setLoading(true);
      const data = await apiGet<ConstanteEntry[]>(CONSTANTES.HISTORIQUE(patientId));
      setConstantes(data ?? []);
    } catch {
      try {
        const data = await apiGet<ConstanteEntry[]>(CONSTANTES.BY_PATIENT(patientId));
        setConstantes(data ?? []);
      } catch {
        setConstantes([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </SafeAreaView>
    );
  }

  const latest = constantes[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Constantes vitales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
        showsVerticalScrollIndicator={false}
      >
        {latest ? (
          <View style={styles.latestCard}>
            <View style={styles.latestHeader}>
              <Ionicons name="pulse" size={20} color={LUNA_COLORS.secondary} />
              <Text style={styles.latestTitle}>Derni\u00e8res mesures</Text>
              <Text style={styles.latestDate}>
                {new Date(latest.dateMesure).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.vitalsGrid}>
              {VITAL_FIELDS.map(({ key, label, unit, icon }) => {
                const value = latest[key];
                if (value === undefined || value === null) return null;
                return (
                  <View key={key} style={styles.vitalBox}>
                    <Ionicons name={icon} size={20} color={LUNA_COLORS.secondary} />
                    <Text style={styles.vitalLabel}>{label}</Text>
                    <Text style={styles.vitalValue}>{String(value)} <Text style={styles.vitalUnit}>{unit}</Text></Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Historique</Text>

        {constantes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="pulse-outline" size={48} color={LUNA_COLORS.textDisabled} />
            <Text style={styles.emptyText}>Aucune constante vitale enregistr\u00e9e</Text>
          </View>
        ) : (
          constantes.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <Text style={styles.historyDate}>
                {new Date(entry.dateMesure).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View style={styles.historyValues}>
                {VITAL_FIELDS.map(({ key, label, unit }) => {
                  const value = entry[key];
                  if (value === undefined || value === null) return null;
                  return (
                    <Text key={key} style={styles.historyValue}>
                      {label}: <Text style={styles.historyValueBold}>{String(value)} {unit}</Text>
                    </Text>
                  );
                })}
              </View>
              {entry.medecinNom ? <Text style={styles.historyAuteur}>Dr {entry.medecinNom}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨
    backgroundColor: LUNA_COLORS.surface,
  },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },

  scroll: { padding: spacing.md, paddingBottom: 80 },

  latestCard: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: LUNA_COLORS.secondary + '33',
    ...shadows.md as object,
  },
  latestHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  latestTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark, flex: 1 },
  latestDate: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },

  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  vitalBox: {
    flexBasis: '47%', backgroundColor: LUNA_COLORS.background,
    borderRadius: borderRadius.sm, padding: spacing.sm, alignItems: 'center', gap: 2,
  },
  vitalLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  vitalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  vitalUnit: { fontSize: fontSize.xs, fontWeight: fontWeight.regular, color: LUNA_COLORS.textDisabled },

  sectionTitle: {

    ...typography.sectionTitle,

    paddingHorizontal: spacing.xl,

    marginBottom: spacing.md,

    marginTop: spacing.lg,

  }, // ✨

  historyCard: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: LUNA_COLORS.border,
    borderLeftWidth: 3, borderLeftColor: LUNA_COLORS.secondary,
  },
  historyDate: { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled, marginBottom: spacing.xs },
  historyValues: { gap: 2 },
  historyValue: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  historyValueBold: { fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary },
  historyAuteur: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, fontStyle: 'italic', marginTop: spacing.xs },

  emptyWrap: { alignItems: 'center', paddingTop: 40, gap: spacing.md },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled },
});