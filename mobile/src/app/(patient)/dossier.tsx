import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { patientPortalService, type DossierMedical } from '@/src/api/services/patient-portal.service';
import { DashboardQuickLinks, EmptyState, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientDossierScreen(): React.JSX.Element {
  const patientId = useAuthStore((s) => s.userId);
  const [dossier, setDossier] = useState<DossierMedical | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await patientPortalService.getDossier(patientId);
      setDossier(data);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Impossible de charger le dossier.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Mon dossier médical" subtitle="Informations de santé" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
      >
        {error ? (
          <EmptyState icon="alert-circle-outline" title="Erreur" subtitle={error} />
        ) : !dossier ? (
          <EmptyState icon="folder-open-outline" title="Dossier vide" subtitle="Aucune donnée disponible." />
        ) : (
          <>
            <Section title="Groupe sanguin" value={dossier.groupeSanguin ?? '—'} />
            <ListSection title="Allergies" items={dossier.allergies} />
            <ListSection title="Antécédents" items={dossier.antecedents} />
            <ListSection title="Maladies chroniques" items={dossier.maladiesChroniques} />
          </>
        )}
        <DashboardQuickLinks maxItems={8} />
      </ScrollView>
    </LunaScreen>
  );
}

function Section({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function ListSection({ title, items }: { title: string; items?: string[] }) {
  const list = items?.length ? items : ['Aucune information'];
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {list.map((item, i) => (
        <Text key={`${title}-${i}`} style={styles.listItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...(shadows.sm as object),
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginBottom: spacing.sm,
  },
  cardValue: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  listItem: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginBottom: 4 },
});
