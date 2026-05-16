import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DemandeOperationDetail {
  id: string;
  patientId?: string;
  patientNom?: string;
  patientPrenom?: string;
  typeOperation: string;
  description?: string;
  datePrevue?: string;
  statut: string;
  priorite?: string;
  demandeurId?: string;
}

// ── Écran Détail Demande d'Opération ──────────────────────────────────────────
export default function OperationDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [op, setOp] = useState<DemandeOperationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiGet<DemandeOperationDetail>(DEMANDES_OPERATION.BY_ID(id));
      setOp(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;
  if (!op) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Opération introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{op.typeOperation}</Text>
          <Text style={styles.headerSub}>{op.patientPrenom} {op.patientNom}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => router.push(`/(medecin)/operations/${id}/plan` as never)}>
            <Text style={styles.actionBtnText}>Plan opératoire</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push(`/(medecin)/operations/${id}/compte-rendu` as never)}>
            <Text style={styles.actionBtnText}>Compte rendu</Text>
          </Pressable>
        </View>
        {/* Infos */}
        <View style={styles.card}>
          <InfoRow label="Date prévue" value={op.datePrevue ? new Date(op.datePrevue).toLocaleDateString('fr-FR') : '—'} />
          <InfoRow label="Statut" value={op.statut} />
          <InfoRow label="Priorité" value={op.priorite ?? '—'} />
          {op.description && <InfoRow label="Description" value={op.description} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { marginLeft: spacing.sm, flex: 1 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  headerSub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  content: { padding: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1, backgroundColor: LUNA_COLORS.secondary, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg,
    padding: spacing.xl, marginBottom: spacing.lg,
    ...shadows.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  infoLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  infoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, flex: 1, textAlign: 'right' },
  errorText: { fontSize: fontSize.base, color: LUNA_COLORS.error, textAlign: 'center', marginTop: spacing.xxl },
});
