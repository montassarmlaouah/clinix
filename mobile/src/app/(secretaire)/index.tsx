import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiGet } from '@/src/api/client';
import { RDV, PATIENTS, DEMANDES_OPERATION } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { DashboardQuickLinks } from '@/src/components/common/DashboardQuickLinks';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Alerte {
  type:     string;
  message:  string;
  id?:      string;
}

interface DashboardData {
  patientsAdmisAujourdhui: number;
  operationsDuJour:        number;
  rendezVousEnAttente:     number;
  transfertsATraiter:      number;
  equipeIncomplete:        number;
  notificationsExpirees:   number;
  alertes:                 Alerte[];
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}): React.JSX.Element {
  return (
    <View style={[styles.metricCard, color ? { borderTopColor: color } : null]}>
      <Ionicons name={icon} size={24} color={color ?? LUNA_COLORS.secondary} />
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SecretaireDashboard(): React.JSX.Element {
  const router     = useRouter();
  const { cliniqueId, prenom, nom } = useAuthStore();

  usePageHeader({ title: 'Accueil', subtitle: 'Tableau de bord secrétaire' });
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!cliniqueId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      // Appels réels en parallèle — DASHBOARD_SECRETAIRE n'existe pas côté backend
      const [rdvJour, operations] = await Promise.allSettled([
        apiGet<{ id: string; statut: string; dateHeure: string }[]>(RDV.BY_CLINIQUE_JOUR(cliniqueId)),
        apiGet<{ id: string; statut: string; dateCreation: string }[]>(
          `${DEMANDES_OPERATION.LIST}?cliniqueId=${cliniqueId}`
        ),
      ]);

      const rdvList   = rdvJour.status   === 'fulfilled' ? rdvJour.value   : [];
      const opList    = operations.status === 'fulfilled' ? operations.value : [];

      const today = new Date().toDateString();
      const rdvEnAttente = rdvList.filter((r) => r.statut === 'PLANIFIE' || r.statut === 'CONFIRME').length;
      const opDuJour     = opList.filter((o) =>
        new Date(o.dateCreation).toDateString() === today
      ).length;

      setData({
        patientsAdmisAujourdhui: 0,   // requiert un endpoint dédié absent
        operationsDuJour:        opDuJour,
        rendezVousEnAttente:     rdvEnAttente,
        transfertsATraiter:      0,   // TransfertsPatientsController absent
        equipeIncomplete:        0,   // EquipesOperatoiresController absent
        notificationsExpirees:   0,
        alertes:                 [],
      });
    } catch {
      /* silent — show stale data */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  const alerteColor: Record<string, string> = {
    TTL_EXPIRE:        LUNA_COLORS.error,
    TRANSFERT_URGENT:  LUNA_COLORS.warning,
    EQUIPE_INCOMPLETE: LUNA_COLORS.warning,
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {prenom ?? ''} {nom ?? ''}</Text>
          <Text style={styles.subtitle}>Tableau de bord secrétaire</Text>
        </View>
        <TouchableOpacity onPress={() => load()} accessibilityLabel="Actualiser">
          <Ionicons name="refresh-outline" size={22} color={LUNA_COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Metric cards */}
      <View style={styles.metricsGrid}>
        <MetricCard
          label="Admissions auj."
          value={data?.patientsAdmisAujourdhui ?? 0}
          icon="person-add-outline"
        />
        <MetricCard
          label="Opérations auj."
          value={data?.operationsDuJour ?? 0}
          icon="medkit-outline"
          color={LUNA_COLORS.tertiary}
        />
        <MetricCard
          label="RDV en attente"
          value={data?.rendezVousEnAttente ?? 0}
          icon="calendar-outline"
        />
        <MetricCard
          label="Transferts à traiter"
          value={data?.transfertsATraiter ?? 0}
          icon="swap-horizontal-outline"
          color={data && data.transfertsATraiter > 0 ? LUNA_COLORS.warning : undefined}
        />
        <MetricCard
          label="Équipes incomplètes"
          value={data?.equipeIncomplete ?? 0}
          icon="people-outline"
          color={data && data.equipeIncomplete > 0 ? LUNA_COLORS.error : undefined}
        />
        <MetricCard
          label="TTL expirés"
          value={data?.notificationsExpirees ?? 0}
          icon="time-outline"
          color={data && data.notificationsExpirees > 0 ? LUNA_COLORS.error : undefined}
        />
      </View>

      {/* Alertes */}
      {data?.alertes && data.alertes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Alertes</Text>
          {data.alertes.map((a, i) => (
            <View
              key={a.id ?? i}
              style={[
                styles.alerteCard,
                { borderLeftColor: alerteColor[a.type] ?? LUNA_COLORS.secondary },
              ]}
            >
              <Text style={[styles.alerteType, { color: alerteColor[a.type] ?? LUNA_COLORS.secondary }]}>
                {a.type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.alerteMsg}>{a.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <DashboardQuickLinks
          maxItems={8}
          pinnedRoutes={[
            '/(secretaire)/patients',
            '/(secretaire)/chambres',
            '/(secretaire)/rendez-vous',
            '/(secretaire)/conges-medecin',
            '/(secretaire)/demandes-operation',
            '/(secretaire)/abonnement',
          ]}
        />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: spacing.sm,
  },
  greeting: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  subtitle: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
  },
  metricCard: {
    width:           '47%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    padding:         spacing.md,
    alignItems:      'center',
    gap:             spacing.xs,
    borderTopWidth:  3,
    borderTopColor:  LUNA_COLORS.secondary,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  metricValue: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.dark,
  },
  metricLabel: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },

  section:      { gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },

  alerteCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.sm,
    padding:         spacing.sm,
    borderLeftWidth: 4,
    gap:             4,
  },
  alerteType: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  alerteMsg:  { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },

  actions: { gap: spacing.sm },
  actionBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.sm,
    padding:         spacing.md,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    3,
    elevation:       1,
  },
  actionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark },
});
