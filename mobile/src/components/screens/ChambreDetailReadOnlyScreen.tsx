import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { CHAMBRES } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Chambre {
  id: string | number;
  numero: string;
  type?: string;
  statut?: string;
  capacite?: number;
  service?: { nom?: string };
  patient?: { id?: string; nom?: string; prenom?: string } | null;
}

function statutLabel(statut?: string): { label: string; color: string; bg: string } {
  if (statut === 'OCCUPEE') return { label: 'Occupée', color: LUNA_COLORS.error, bg: LUNA_COLORS.errorLight };
  if (statut === 'EN_MAINTENANCE') return { label: 'Maintenance', color: LUNA_COLORS.warning, bg: LUNA_COLORS.warningLight };
  return { label: 'Disponible', color: LUNA_COLORS.success, bg: LUNA_COLORS.successLight };
}

export function ChambreDetailReadOnlyScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chambre, setChambre] = useState<Chambre | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiGet<Chambre>(CHAMBRES.BY_ID(id));
      setChambre(data);
    } catch {
      setChambre(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!chambre) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Chambre introuvable</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const st = statutLabel(chambre.statut);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.darkest} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Chambre {chambre.numero}</Text>
          <Text style={styles.sub}>{chambre.type ?? '—'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Capacité" value={chambre.capacite != null ? String(chambre.capacite) : '—'} />
          <InfoRow label="Service" value={chambre.service?.nom ?? '—'} />
          <InfoRow
            label="Patient"
            value={
              chambre.patient
                ? `${chambre.patient.prenom ?? ''} ${chambre.patient.nom ?? ''}`.trim()
                : 'Aucun'
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderSubtle,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  headerText: { flex: 1 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  body: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    ...(shadows.sm as object),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  rowValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, flex: 1, textAlign: 'right' },
  error: { textAlign: 'center', marginTop: spacing.xxl, color: LUNA_COLORS.error },
  backLink: { alignSelf: 'center', marginTop: spacing.lg },
  backLinkText: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
});
