import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { apiGet } from '@/src/api/client';
import { IMAGERIES, RADIOLOGUE_WORKSPACE } from '@/src/api/endpoints';
import {
  DashboardQuickLinks,
  ListCard,
  LoadingOverlay,
  LunaHeroHeader,
  LunaScreen,
  LunaStatCard,
} from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface RadiologueStats {
  totalImageriesJour: number;
  totalImageriesMois: number;
  enAttente: number;
  enCours: number;
  terminees: number;
  rapportsRediges: number;
  rapportsValides: number;
}

interface ImagerieItem {
  id: string | number;
  typeExamen?: string;
  type?: string;
  statut?: string;
  dateCreation?: string;
  priorite?: string;
  patientNom?: string;
  patientPrenom?: string;
  patient?: { nom: string; prenom: string };
}

export default function RadiologueDashboard(): React.JSX.Element {
  const router = useRouter();
  const { prenom, nom } = useAuthStore();
  const [stats, setStats] = useState<RadiologueStats | null>(null);
  const [imageries, setImageries] = useState<ImagerieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [statsData, imageriesData] = await Promise.all([
        apiGet<RadiologueStats>(RADIOLOGUE_WORKSPACE.STATS),
        apiGet<ImagerieItem[]>(IMAGERIES.EN_ATTENTE),
      ]);
      setStats(statsData ?? null);
      setImageries((imageriesData ?? []).slice(0, 8));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur de chargement';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Radiologie"
        subtitle={`${prenom ?? ''} ${nom ?? ''}`.trim() || 'Espace radiologue'}
      />
      <FlatList
        data={imageries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListHeaderComponent={
          <View>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {stats ? (
              <View style={styles.statsRow}>
                <Pressable style={styles.kpi} onPress={() => router.push('/(radiologue)/demandes' as never)}>
                  <LunaStatCard
                    label="En attente"
                    value={stats.enAttente}
                    icon="time-outline"
                    color={LUNA_COLORS.accentOrange}
                  />
                </Pressable>
                <Pressable style={styles.kpi} onPress={() => router.push('/(radiologue)/rapports' as never)}>
                  <LunaStatCard
                    label="Terminées"
                    value={stats.terminees}
                    icon="checkmark-circle-outline"
                    color={LUNA_COLORS.success}
                  />
                </Pressable>
              </View>
            ) : null}
            {stats ? (
              <View style={styles.statsRow}>
                <LunaStatCard label="En cours" value={stats.enCours} icon="pulse-outline" color="#3B82F6" />
                <LunaStatCard
                  label="Rapports validés"
                  value={stats.rapportsValides}
                  icon="document-text-outline"
                  color="#A855F7"
                />
              </View>
            ) : null}

            <Text style={styles.section}>Examens récents (file d'attente)</Text>
          </View>
        }
        renderItem={({ item }) => {
          const patient =
            item.patient
              ? `${item.patient.prenom} ${item.patient.nom}`
              : item.patientNom
                ? `${item.patientPrenom ?? ''} ${item.patientNom}`.trim()
                : undefined;
          return (
            <ListCard
              title={item.typeExamen ?? item.type ?? 'Examen'}
              subtitle={patient}
              meta={item.statut?.replace(/_/g, ' ') ?? 'En attente'}
              accentColor={LUNA_COLORS.secondary}
              onPress={() => router.push('/(radiologue)/demandes' as never)}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun examen en file d'attente</Text>
        }
        ListFooterComponent={<DashboardQuickLinks maxItems={6} />}
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  // ✨ Liste — paddingBottom tab bar
  list: { padding: spacing.lg, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  kpi: { flex: 1 },
  // ✨ Titre de section — typography.sectionTitle
  section: { ...typography.sectionTitle, marginBottom: spacing.sm, marginTop: spacing.sm },
  errorBanner: {
    backgroundColor: LUNA_COLORS.errorLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: { color: LUNA_COLORS.error, fontSize: fontSize.sm, textAlign: 'center' },
  empty: { color: LUNA_COLORS.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
});
