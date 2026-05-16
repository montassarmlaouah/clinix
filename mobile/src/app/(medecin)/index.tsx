import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { apiGet } from '@/src/api/client';
import { CONSTANTES, MEDECINS } from '@/src/api/endpoints';
import { DashboardQuickLinks, EmptyState, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

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
  dateHeure?: string;
}

interface Alerte {
  patientId?: string;
  lue?: boolean;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'HOSPITALISE', label: 'Hospitalises' },
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

export default function MedecinDashboard(): React.JSX.Element {
  const router = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [constantes, setConstantes] = useState<Record<string, Constante | null>>({});
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [filter, setFilter] = useState<FilterKey>('HOSPITALISE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!medecinId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      let patientData: Patient[] = [];
      if (hasMedecinClinique(cliniqueId)) {
        patientData = await patientService.getByClinique(String(cliniqueId));
      } else {
        patientData = await apiGet<Patient[]>(MEDECINS.PATIENTS_LIST(medecinId));
      }
      setPatients(patientData ?? []);

      const latestEntries = await Promise.all(
        (patientData ?? []).map(async (patient) => {
          const history = await apiGet<Constante[]>(CONSTANTES.HISTORIQUE(patient.id)).catch(() => []);
          return [patient.id, history[0] ?? null] as const;
        }),
      );
      setConstantes(Object.fromEntries(latestEntries));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId, cliniqueId]);

  useEffect(() => { load(); }, [load]);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => normalizeStatut(patient.statut) === filter),
    [patients, filter],
  );

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Tableau de bord"
        subtitle={`${patients.length} patient(s) suivi(s)`}
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

      <View style={{ paddingHorizontal: spacing.lg }}>
        <DashboardQuickLinks
          maxItems={9}
          excludeRoutes={['/(medecin)/index', '/(medecin)/patients', '/(medecin)/messagerie']}
        />
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

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        renderItem={({ item }) => {
          const statut = normalizeStatut(item.statut);
          const colors = statusStyle(statut);
          const latest = constantes[item.id];
          const hasAlert = alertes.some((alerte) => alerte.patientId === item.id && !alerte.lue);
          const chambre = item.chambreNumero ?? item.chambre?.numero;

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/(medecin)/patients/${item.id}` as never)}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.prenom?.[0]}{item.nom?.[0]}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
                  <Text style={styles.meta}>
                    {item.age ? `${item.age} ans` : 'Age non renseigne'}
                    {chambre ? ` - Chambre ${chambre}` : ''}
                  </Text>
                </View>
                {hasAlert ? <View style={styles.alertDot} /> : null}
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.vitals}>
                  <Text style={styles.vitalText}>
                    TA {latest?.taSystolique && latest?.taDiastolique ? `${latest.taSystolique}/${latest.taDiastolique}` : '--'}
                  </Text>
                  <Text style={styles.vitalText}>SpO2 {latest?.spo2 ?? '--'}%</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusText, { color: colors.fg }]}>{statut.toLowerCase()}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun patient"
            subtitle="Aucun patient ne correspond au filtre selectionne."
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  filter: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    backgroundColor: LUNA_COLORS.background,
  },
  filterActive: { backgroundColor: LUNA_COLORS.secondary },
  filterText: { fontSize: fontSize.xs, color: LUNA_COLORS.dark, fontWeight: fontWeight.medium },
  filterTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  list: { padding: spacing.xxl, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: LUNA_COLORS.textInverse, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  info: { flex: 1 },
  patientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  alertDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: LUNA_COLORS.error },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  vitals: { flexDirection: 'row', gap: spacing.sm },
  vitalText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
});
