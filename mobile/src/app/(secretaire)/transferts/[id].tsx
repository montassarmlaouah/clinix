import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';
import { LoadingOverlay } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface DemandeDetail {
  id: string | number;
  statut?: string;
  motif?: string;
  notes?: string;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string; numeroPatient?: string };
}

export default function TransfertDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<DemandeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiGet<DemandeDetail>(DEMANDES_OPERATION.BY_ID(id));
      setDetail(data);
    } catch { setDetail(null); } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Demande #{id}</Text>
        <View style={styles.card}>
          <Row label="Patient" value={`${detail?.patient?.prenom ?? ''} ${detail?.patient?.nom ?? ''}`.trim() || '—'} />
          <Row label="N° patient" value={detail?.patient?.numeroPatient ?? '—'} />
          <Row label="Statut" value={detail?.statut ?? '—'} />
          <Row label="Motif" value={detail?.motif ?? '—'} />
          <Row label="Notes" value={detail?.notes ?? '—'} />
          <Row
            label="Créée le"
            value={detail?.dateCreation ? new Date(detail.dateCreation).toLocaleString('fr-FR') : '—'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.xxl },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.lg },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...(shadows.sm as object),
  },
  row: { gap: 4 },
  label: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: fontSize.base, color: LUNA_COLORS.darkest },
});
