import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { LoadingOverlay } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface DemandeOperationDetail {
  id: string;
  patientNom?: string;
  patientPrenom?: string;
  typeOperation?: string;
  description?: string;
  datePrevue?: string;
  statut?: string;
  priorite?: string;
}

export default function InfirmierDemandeOperationDetail(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [op, setOp] = useState<DemandeOperationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiGet<DemandeOperationDetail>(DEMANDES_OPERATION.BY_ID(id));
      setOp(data);
    } catch {
      setOp(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  if (!op) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Demande introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.darkest} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{op.typeOperation ?? 'Opération'}</Text>
          <Text style={styles.sub}>{op.patientPrenom} {op.patientNom}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Row label="Date prévue" value={op.datePrevue ? new Date(op.datePrevue).toLocaleDateString('fr-FR') : '—'} />
          <Row label="Statut" value={op.statut ?? '—'} />
          <Row label="Priorité" value={op.priorite ?? '—'} />
          {op.description ? <Row label="Description" value={op.description} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
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
    padding: spacing.lg,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  backBtn: { marginRight: spacing.sm, padding: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  body: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  rowValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, flex: 1, textAlign: 'right' },
  error: { textAlign: 'center', marginTop: spacing.xxl, color: LUNA_COLORS.error },
});
