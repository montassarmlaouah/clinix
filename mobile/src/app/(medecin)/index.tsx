import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { apiGet } from '@/src/api/client';
import { CONSTANTES, MEDECINS } from '@/src/api/endpoints';
import { patientService } from '@/src/api/services/patient.service';
import { hasMedecinClinique } from '@/src/utils/medecinContext';
import {
  ChartCard,
  DashboardQuickLinks,
  EmptyState,
  LegendItem,
  LunaHeroHeader,
  LunaScreen,
  StatRow,
} from '@/src/components/common';
import { CHART_COLORS, CHART_PALETTE } from '@/src/constants/chartColors';
import { useDashboardStats } from '@/src/hooks/useDashboardStats';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 80;

// ── Types locaux ──────────────────────────────────────────────────────────────
type FilterKey = 'HOSPITALISE' | 'CONSULTATION' | 'URGENCE';

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  age?: number;
  statut?: string;
  chambreNumero?: string | null;
  chambre?: { numero?: string } | null;
}

interface Constante {
  taSystolique?: number;
  taDiastolique?: number;
  spo2?: number;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'HOSPITALISE', label: 'Hospitalisés' },
  { key: 'CONSULTATION', label: 'Consultations' },
  { key: 'URGENCE', label: 'Urgences' },
];

function normalizeStatut(statut?: string): FilterKey {
  const value = (statut ?? '').toUpperCase();
  if (value.includes('URGENCE')) return 'URGENCE';
  if (value.includes('CONSULT')) return 'CONSULTATION';
  return 'HOSPITALISE';
}

function statusStyle(statut: FilterKey) {
  if (statut === 'URGENCE') return { bg: LUNA_COLORS.errorLight, fg: LUNA_COLORS.error };
  if (statut === 'CONSULTATION') return { bg: LUNA_COLORS.successLight, fg: LUNA_COLORS.success };
  return { bg: LUNA_COLORS.infoLight, fg: LUNA_COLORS.tertiary };
}

// ── Composant patient card ────────────────────────────────────────────────────
function PatientCard({
  item,
  latest,
  onPress,
}: {
  item: Patient;
  latest: Constante | null | undefined;
  onPress: () => void;
}): React.JSX.Element {
  const statut = normalizeStatut(item.statut);
  const colors = statusStyle(statut);
  const chambre = item.chambreNumero ?? item.chambre?.numero;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.prenom?.[0]}{item.nom?.[0]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
          <Text style={styles.meta}>
            {item.age ? `${item.age} ans` : 'Âge non renseigné'}
            {chambre ? ` · Chambre ${chambre}` : ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.fg }]}>{statut.toLowerCase()}</Text>
        </View>
      </View>
      <View style={styles.vitals}>
        <Text style={styles.vitalText}>
          TA {latest?.taSystolique && latest?.taDiastolique
            ? `${latest.taSystolique}/${latest.taDiastolique}`
            : '--'}
        </Text>
        <Text style={styles.vitalDivider}>·</Text>
        <Text style={styles.vitalText}>SpO2 {latest?.spo2 ?? '--'}%</Text>
      </View>
    </Pressable>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function MedecinDashboard(): React.JSX.Element {
  const router    = useRouter();
  const { userId: medecinId, cliniqueId, nom } = useAuthStore();

  // Stats KPI + graphiques
  const { data: stats, loading: statsLoading, refetch } = useDashboardStats('medecin', cliniqueId, medecinId);

  // Liste des patients pour le mini-tableau
  const [patients,   setPatients]   = useState<Patient[]>([]);
  const [constantes, setConstantes] = useState<Record<string, Constante | null>>({});
  const [filter,     setFilter]     = useState<FilterKey>('HOSPITALISE');
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = useCallback(async (silent = false) => {
    if (!medecinId) return;
    try {
      let data: Patient[] = [];
      if (hasMedecinClinique(cliniqueId)) {
        data = await patientService.getByClinique(String(cliniqueId));
      } else {
        data = await apiGet<Patient[]>(MEDECINS.PATIENTS_LIST(medecinId));
      }
      setPatients(data ?? []);
      const entries = await Promise.all(
        (data ?? []).map(async (p) => {
          const history = await apiGet<Constante[]>(CONSTANTES.HISTORIQUE(p.id)).catch(() => []);
          return [p.id, history[0] ?? null] as const;
        }),
      );
      setConstantes(Object.fromEntries(entries));
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [medecinId, cliniqueId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    loadPatients(true).finally(() => setRefreshing(false));
  }, [refetch, loadPatients]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const filteredPatients = useMemo(
    () => patients.filter((p) => normalizeStatut(p.statut) === filter),
    [patients, filter],
  );

  const consultEvol  = stats?.consultationsEvolution ?? [];
  const patStatus    = stats?.patientsByStatus       ?? [];
  const apptByHour   = stats?.appointmentsByHour     ?? [];

  return (
    <LunaScreen edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
      >
        {/* ── En-tête ── */}
        <LunaHeroHeader
          title={`Dr ${nom ?? 'Médecin'}`}
          subtitle={`${patients.length} patient(s) suivi(s) · Tableau de bord`}
          showBack={false}
          right={
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push('/(medecin)/examens' as never)} style={styles.headerIcon}>
                <Ionicons name="flask-outline" size={22} color={LUNA_COLORS.textInverse} />
              </Pressable>
              <Pressable onPress={() => router.push('/(medecin)/alertes' as never)} style={styles.headerIcon}>
                <Ionicons name="warning-outline" size={22} color={LUNA_COLORS.warning} />
              </Pressable>
            </View>
          }
        />

        {/* ── KPIs ── */}
        {statsLoading ? (
          <ActivityIndicator
            color={LUNA_COLORS.secondary}
            style={{ marginVertical: spacing.xl }}
          />
        ) : stats?.kpis && stats.kpis.length > 0 ? (
          <StatRow stats={stats.kpis} />
        ) : null}

        {/* ── Raccourcis ── */}
        <View style={styles.quickLinksWrapper}>
          <DashboardQuickLinks
            maxItems={9}
            excludeRoutes={['/(medecin)/index', '/(medecin)/patients', '/(medecin)/messagerie']}
          />
        </View>

        {/* ── Évolution des consultations ── */}
        {consultEvol.length > 0 && (
          <ChartCard
            title="Évolution des consultations"
            subtitle="8 dernières semaines"
            badge="Live"
          >
            <LineChart
              areaChart
              data={consultEvol}
              width={CHART_W}
              height={160}
              color1={CHART_COLORS.primary}
              startFillColor1={CHART_COLORS.primary}
              endFillColor1="transparent"
              startOpacity1={0.25}
              curved
              thickness={2.5}
              rulesColor={CHART_COLORS.gridLines}
              yAxisColor="transparent"
              xAxisColor="rgba(38,101,140,0.15)"
              xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              noOfSections={4}
              dataPointsColor1={CHART_COLORS.primary}
            />
          </ChartCard>
        )}

        {/* ── Répartition patients par statut ── */}
        {patStatus.length > 0 && (
          <ChartCard title="Répartition des patients" subtitle="Par statut actuel">
            <View style={styles.pieRow}>
              <PieChart
                data={patStatus}
                radius={70}
                innerRadius={42}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterNum}>{patients.length}</Text>
                    <Text style={styles.pieCenterLabel}>patients</Text>
                  </View>
                )}
              />
              <View style={styles.legend}>
                {patStatus.map((p, i) => (
                  <LegendItem key={i} color={p.color} label={`${p.label ?? ''} (${p.text ?? p.value})`} />
                ))}
              </View>
            </View>
          </ChartCard>
        )}

        {/* ── RDV par heure ── */}
        {apptByHour.length > 0 && (
          <ChartCard title="RDV par heure" subtitle="Répartition journalière">
            <BarChart
              data={apptByHour}
              width={CHART_W}
              height={140}
              barWidth={22}
              barBorderRadius={4}
              frontColor={CHART_COLORS.secondary}
              rulesColor={CHART_COLORS.gridLines}
              yAxisColor="transparent"
              xAxisColor="rgba(38,101,140,0.15)"
              xAxisLabelTextStyle={{ color: CHART_COLORS.axisText, fontSize: 10 }}
              yAxisTextStyle={{ color: CHART_COLORS.axisText, fontSize: 11 }}
              noOfSections={3}
            />
          </ChartCard>
        )}

        {/* ── Mini-liste patients ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes patients</Text>
          <Pressable onPress={() => router.push('/(medecin)/patients' as never)}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </Pressable>
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filter, filter === item.key && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredPatients.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Aucun patient"
            subtitle="Aucun patient dans cette catégorie."
          />
        ) : (
          <View style={styles.patientList}>
            {filteredPatients.slice(0, 5).map((item) => (
              <PatientCard
                key={item.id}
                item={item}
                latest={constantes[item.id]}
                onPress={() => router.push(`/(medecin)/patients/${item.id}` as never)}
              />
            ))}
            {filteredPatients.length > 5 && (
              <Pressable
                style={styles.moreBtn}
                onPress={() => router.push('/(medecin)/patients' as never)}
              >
                <Text style={styles.moreBtnText}>
                  +{filteredPatients.length - 5} autres patients
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </LunaScreen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll:          { paddingBottom: 100 },
  headerActions:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerIcon: {
    width: 40, height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  quickLinksWrapper: { paddingHorizontal: spacing.lg },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sectionLink:  { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },

  // ── Filtres ──
  filters: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.xxl, paddingBottom: spacing.md,
  },
  filter: {
    flex: 1, alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    backgroundColor: LUNA_COLORS.background,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  filterActive:       { backgroundColor: LUNA_COLORS.secondary },
  filterText:         { fontSize: fontSize.xs, color: LUNA_COLORS.dark, fontWeight: fontWeight.medium },
  filterTextActive:   { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },

  // ── Patient list ──
  patientList:  { paddingHorizontal: spacing.xxl },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  cardTop:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  info:          { flex: 1 },
  patientName:   { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta:          { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  statusBadge:   { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusText:    { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  vitals:        { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  vitalText:     { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  vitalDivider:  { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  moreBtn: {
    alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    marginBottom: spacing.md,
  },
  moreBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.medium },

  // ── Pie chart ──
  pieRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  pieCenter:     { alignItems: 'center' },
  pieCenterNum:  { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  pieCenterLabel:{ fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  legend:        { flex: 1, gap: spacing.xs },
});
