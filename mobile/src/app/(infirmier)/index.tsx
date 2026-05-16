import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DashboardQuickLinks, EmptyState, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface OperationSummary {
  id: string;
  typeOperation: string;
  heureDebutPrevue?: string;
  statut: string;
  patient?: { nom: string; prenom: string };
}

export default function InfirmierDashboard() {
  const router = useRouter();
  const { userId: userIdRaw, cliniqueId } = useAuthStore();
  const userId = String(userIdRaw ?? '');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operations, setOperations] = useState<OperationSummary[]>([]);
  const [pendingTasks, setPendingTasks] = useState(0);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const administrations = await apiGet<{ statut?: string }[]>(
        ADMINISTRATIONS.BY_INFIRMIER(userId)
      ).catch(() => []);
      setPendingTasks(administrations.filter((item) => item.statut !== 'ADMINISTRE' && item.statut !== 'FAIT').length);

      // Planning — endpoint optionnel
      try {
        const today = new Date().toISOString().split('T')[0];
        const ops = await apiGet<OperationSummary[]>(
          `/api/infirmiers/${userId}/planning?date=${today}${cliniqueId ? `&organisationId=${cliniqueId}` : ''}`,
        );
        setOperations(ops);
      } catch {
        // Endpoint peut ne pas exister — ignorer
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, cliniqueId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <LoadingOverlay />;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Accueil infirmier" subtitle={today} showBack={false} />

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.metricsRow}>
              <Pressable
                style={[styles.metricCard, { backgroundColor: LUNA_COLORS.infoLight }]}
                onPress={() => router.push('/(infirmier)/soins')}
              >
                <Ionicons name="medical-outline" size={24} color={LUNA_COLORS.info} />
                <Text style={styles.metricValue}>{pendingTasks}</Text>
                <Text style={styles.metricLabel}>Soins à faire</Text>
              </Pressable>

              <Pressable
                style={[styles.metricCard, { backgroundColor: LUNA_COLORS.successLight }]}
                onPress={() => router.push('/(infirmier)/patients')}
              >
                <Ionicons name="people-outline" size={24} color={LUNA_COLORS.success} />
                <Text style={styles.metricValue}>Patients</Text>
                <Text style={styles.metricLabel}>Liste</Text>
              </Pressable>
            </View>

            <DashboardQuickLinks maxItems={6} excludeRoutes={['/(infirmier)/index']} />

            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsRow}>
              <QuickAction
                icon="thermometer-outline"
                label="Constantes"
                onPress={() => router.push('/(infirmier)/patients')}
              />
              <QuickAction
                icon="medkit-outline"
                label="Soins"
                onPress={() => router.push('/(infirmier)/soins')}
              />
              <QuickAction
                icon="calendar-outline"
                label="Planning"
                onPress={() => router.push('/(infirmier)/planning')}
              />
              <QuickAction
                icon="alert-circle-outline"
                label="Alertes"
                onPress={() => router.push('/(infirmier)/alertes')}
              />
              <QuickAction
                icon="home-outline"
                label="Visites"
                onPress={() => router.push('/(infirmier)/visites-jour' as never)}
              />
              <QuickAction
                icon="bandage-outline"
                label="Bracelet"
                onPress={() => router.push('/(infirmier)/bracelet' as never)}
              />
              <QuickAction
                icon="bed-outline"
                label="Hospi."
                onPress={() => router.push('/(infirmier)/hospitalisations' as never)}
              />
              <QuickAction
                icon="airplane-outline"
                label="Congés"
                onPress={() => router.push('/(infirmier)/congie' as never)}
              />
            </View>

            {operations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Planning du jour</Text>
                {operations.map((op) => (
                  <View key={op.id} style={styles.opCard}>
                    <Text style={styles.opTitle}>{op.typeOperation}</Text>
                    <Text style={styles.opMeta}>
                      {op.patient?.nom} {op.patient?.prenom} · {op.heureDebutPrevue?.slice(0, 5) ?? ''}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="medical-outline"
            title="Espace infirmier"
            subtitle="Sélectionnez un patient pour commencer les soins."
          />
        }
      />
    </LunaScreen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon as any} size={22} color={LUNA_COLORS.secondary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  date: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  notifBtn: {
    width: 44, height: 44, borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  metricsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  metricCard: {
    flex: 1, borderRadius: borderRadius.lg, padding: spacing.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  metricValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginTop: spacing.sm },
  metricLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest, paddingHorizontal: spacing.xl,
    marginBottom: spacing.md, marginTop: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  quickAction: { width: '22%', alignItems: 'center' },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: borderRadius.lg,
    backgroundColor: LUNA_COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: LUNA_COLORS.border,
  },
  quickLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  opCard: {
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginHorizontal: spacing.xl, marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border,
  },
  opTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  opMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
});
