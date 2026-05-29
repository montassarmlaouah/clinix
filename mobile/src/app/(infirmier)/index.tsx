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

import { apiGet } from '@/src/api/client';
import {
  ADMINISTRATIONS,
  SURVEILLANCES,
  PRESENCES,
} from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import {
  DashboardQuickLinks,
  EmptyState,
  LunaHeroHeader,
  LunaScreen,
} from '@/src/components/common';
import { SkeletonLoader, SkeletonCard, SkeletonList } from '@/src/components/common/SkeletonLoader';
import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Administration {
  id: string;
  statut?: string;
  dateAdministration?: string;
}

interface Surveillance {
  id: string;
  alerte?: boolean;
  niveauAlerte?: string;
}

interface Presence {
  id: string;
  present?: boolean;
  statut?: string;
}

interface DashboardStats {
  soinsAFaire:      number;
  soinsFaits:       number;
  patientsSuivis:   number;
  alertesCritiques: number;
  presentsAujourdhui: number;
}

// ── Composant action rapide ───────────────────────────────────────────────────

function QuickAction({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon as never} size={22} color={LUNA_COLORS.secondary} />
        {badge != null && badge > 0 && (
          <View style={styles.quickBadge}>
            <Text style={styles.quickBadgeTxt}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

// ── Composant carte KPI ───────────────────────────────────────────────────────

function KpiCard({
  icon,
  value,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  value: number | string;
  label: string;
  color: string;
  bg: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.kpiCard, { backgroundColor: bg }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon as never} size={22} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Pressable>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function InfirmierDashboard() {
  const router   = useRouter();
  const { userId: userIdRaw } = useAuthStore();
  const userId   = String(userIdRaw ?? '');

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats,      setStats]      = useState<DashboardStats>({
    soinsAFaire:        0,
    soinsFaits:         0,
    patientsSuivis:     0,
    alertesCritiques:   0,
    presentsAujourdhui: 0,
  });

  // ── Chargement des données ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      // Appels parallèles — tous avec endpoints réels vérifiés dans endpoints.ts
      const [administrations, surveillances, presences] = await Promise.all([
        apiGet<Administration[]>(ADMINISTRATIONS.BY_INFIRMIER(userId)).catch(() => [] as Administration[]),
        apiGet<Surveillance[]>(SURVEILLANCES.BY_INFIRMIER(userId)).catch(() => [] as Surveillance[]),
        apiGet<Presence[]>(PRESENCES.AUJOURDHUI).catch(() => [] as Presence[]),
      ]);

      // Calcul cohérent avec soins.tsx et _layout.tsx
      const soinsAFaire = administrations.filter(
        (a) => a.statut !== 'ADMINISTRE' && a.statut !== 'FAIT',
      ).length;

      const soinsFaits = administrations.filter(
        (a) => a.statut === 'ADMINISTRE' || a.statut === 'FAIT',
      ).length;

      const alertesCritiques = surveillances.filter(
        (s) => s.alerte === true || s.niveauAlerte === 'CRITIQUE',
      ).length;

      const presentsAujourdhui = presences.filter(
        (p) => p.present === true || p.statut === 'PRESENT',
      ).length;

      setStats({
        soinsAFaire,
        soinsFaits,
        patientsSuivis:   surveillances.length,
        alertesCritiques,
        presentsAujourdhui,
      });
    } catch {
      // Les erreurs individuelles sont absorbées dans les .catch() ci-dessus
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });

  // ✨ Composant skeleton pour KPI grid pendant loading
  const KpiGridSkeleton = () => (
    <View style={styles.kpiGrid}>
      <SkeletonLoader width="47%" height={140} borderRadius={borderRadius.lg} style={{ marginBottom: spacing.md }} />
      <SkeletonLoader width="47%" height={140} borderRadius={borderRadius.lg} style={{ marginBottom: spacing.md }} />
      <SkeletonLoader width="47%" height={140} borderRadius={borderRadius.lg} style={{ marginBottom: spacing.md }} />
      <SkeletonLoader width="47%" height={140} borderRadius={borderRadius.lg} style={{ marginBottom: spacing.md }} />
    </View>
  );

  // ✨ Composant skeleton pour actions
  const ActionsSkeleton = () => (
    <View style={styles.actionsGrid}>
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={styles.quickAction}>
          <SkeletonLoader width={52} height={52} borderRadius={borderRadius.lg} />
          <SkeletonLoader width="100%" height={10} borderRadius={4} style={{ marginTop: spacing.xs }} />
        </View>
      ))}
    </View>
  );

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Espace infirmier"
        subtitle={today}
        showBack={false}
      />

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        ListHeaderComponent={
          <>
            {loading ? (
              <>
                {/* ✨ Skeleton loaders pendant chargement */}
                <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
                  <SkeletonLoader height={56} borderRadius={borderRadius.md} style={{ marginBottom: spacing.lg }} />
                  <KpiGridSkeleton />
                  <Text style={[styles.sectionTitle, { opacity: 0.5 }]}>Actions rapides</Text>
                  <ActionsSkeleton />
                </View>
              </>
            ) : (
              <>
                {/* ── KPIs principaux ─────────────────────────────────────── */}
                <View style={styles.kpiGrid}>
              <KpiCard
                icon="medkit-outline"
                value={stats.soinsAFaire}
                label="Soins à faire"
                color={LUNA_COLORS.error}
                bg={LUNA_COLORS.errorLight}
                onPress={() => router.push('/(infirmier)/soins')}
              />
              <KpiCard
                icon="checkmark-circle-outline"
                value={stats.soinsFaits}
                label="Soins effectués"
                color={LUNA_COLORS.success}
                bg={LUNA_COLORS.successLight}
                onPress={() => router.push('/(infirmier)/soins')}
              />
              <KpiCard
                icon="people-outline"
                value={stats.patientsSuivis}
                label="Patients suivis"
                color={LUNA_COLORS.info}
                bg={LUNA_COLORS.infoLight}
                onPress={() => router.push('/(infirmier)/patients')}
              />
              <KpiCard
                icon="alert-circle-outline"
                value={stats.alertesCritiques}
                label="Alertes critiques"
                color={LUNA_COLORS.warning}
                bg={LUNA_COLORS.warningLight}
                onPress={() => router.push('/(infirmier)/alertes')}
              />
            </View>

            {/* ── Présence du jour ─────────────────────────────────────── */}
            <Pressable
              style={styles.presenceBar}
              onPress={() => router.push('/(infirmier)/presences')}
            >
              <Ionicons
                name="people-circle-outline"
                size={20}
                color={LUNA_COLORS.secondary}
              />
              <Text style={styles.presenceText}>
                {stats.presentsAujourdhui} personnel présent aujourd&apos;hui
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={16}
                color={LUNA_COLORS.textSecondary}
                style={{ marginLeft: 'auto' }}
              />
            </Pressable>

            {/* ── Raccourcis rapides ───────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsGrid}>
              <QuickAction
                icon="thermometer-outline"
                label="Surveillance"
                onPress={() => router.push('/(infirmier)/surveillance-soins' as never)}
              />
              <QuickAction
                icon="medkit-outline"
                label="Soins"
                badge={stats.soinsAFaire}
                onPress={() => router.push('/(infirmier)/soins')}
              />
              <QuickAction
                icon="calendar-outline"
                label="RDV"
                onPress={() => router.push('/(infirmier)/rendez-vous' as never)}
              />
              <QuickAction
                icon="bed-outline"
                label="Chambres"
                onPress={() => router.push('/(infirmier)/chambres' as never)}
              />
              <QuickAction
                icon="alert-circle-outline"
                label="Alertes"
                badge={stats.alertesCritiques}
                onPress={() => router.push('/(infirmier)/alertes')}
              />
              <QuickAction
                icon="home-outline"
                label="Visites"
                onPress={() => router.push('/(infirmier)/visites-jour')}
              />
              <QuickAction
                icon="calendar-outline"
                label="Planning"
                onPress={() => router.push('/(infirmier)/planning')}
              />
              <QuickAction
                icon="bandage-outline"
                label="Bracelet"
                onPress={() => router.push('/(infirmier)/bracelet')}
              />
              <QuickAction
                icon="bed-outline"
                label="Hospi."
                onPress={() => router.push('/(infirmier)/hospitalisations')}
              />
              <QuickAction
                icon="airplane-outline"
                label="Congés"
                onPress={() => router.push('/(infirmier)/congie')}
              />
              <QuickAction
                icon="warning-outline"
                label="Signalements"
                onPress={() => router.push('/(infirmier)/signalements')}
              />
              <QuickAction
                icon="scan-outline"
                label="Scanner"
                onPress={() => router.push('/(infirmier)/scanner')}
              />
              <QuickAction
                icon="time-outline"
                label="Présences"
                onPress={() => router.push('/(infirmier)/presences')}
              />
              <QuickAction
                icon="list-outline"
                label="Tâches"
                badge={stats.soinsAFaire}
                onPress={() => router.push('/(infirmier)/taches-soins' as never)}
              />
              <QuickAction
                icon="checklist-outline"
                label="Check-list"
                onPress={() => router.push('/(infirmier)/check-list')}
              />
            </View>

            {/* ── Liens rapides dynamiques (DashboardQuickLinks) ──────── */}
            <DashboardQuickLinks
              maxItems={4}
              excludeRoutes={['/(infirmier)/index']}
            />
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
        contentContainerStyle={styles.listContent}
      />
    </LunaScreen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: { paddingBottom: 80 },

  // ── KPI grid ────────────────────────────────────────────────────────────────
  kpiGrid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    gap:              spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop:       spacing.lg,
    marginBottom:     spacing.md,
  },
  kpiCard: {
    width:          '47%',
    borderRadius:   borderRadius.lg,
    padding:        spacing.lg,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  kpiValue: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop:  spacing.sm,
  },
  kpiLabel: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // ── Barre présence ───────────────────────────────────────────────────────────
  presenceBar: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom:    spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
  },
  presenceText: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textPrimary,
    flex:     1,
  },

  // ── Titre de section ─────────────────────────────────────────────────────────
  sectionTitle: {
    ...typography.sectionTitle,
    paddingHorizontal: spacing.xl,
    marginBottom:      spacing.md,
    marginTop:         spacing.sm,
  },

  // ── Grille actions rapides ───────────────────────────────────────────────────
  actionsGrid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    paddingHorizontal: spacing.xl,
    gap:              spacing.md,
    marginBottom:     spacing.lg,
  },
  quickAction: {
    width:      '22%',
    alignItems: 'center',
  },
  quickIconWrap: {
    width:           52,
    height:          52,
    borderRadius:    borderRadius.lg,
    backgroundColor: LUNA_COLORS.surface,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
  },
  quickLabel: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Badge sur icône action rapide
  quickBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    backgroundColor: LUNA_COLORS.error,
    borderRadius:    8,
    minWidth:        16,
    height:          16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  quickBadgeTxt: {
    color:      '#fff',
    fontSize:   9,
    fontWeight: fontWeight.bold,
  },
});