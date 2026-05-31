import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { planningService, type GardeRecord, type PlanningRecord } from '@/src/api/services/planning.service';
import { Button, EmptyState, LoadingOverlay, SegmentTabs } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import {
  addDaysToDateString,
  buildDetailByShift,
  buildWeekDays,
  setCurrentMonday,
  type WeekDay,
} from '@/src/utils/planning.utils';

type TabKey = 'semaine' | 'historique';

function planningPeriod(p: PlanningRecord): string {
  const start = p.date ?? p.dateDebut;
  if (!start) return '—';
  const days = p.type === 'MENSUEL' ? 29 : 6;
  return `${start} → ${addDaysToDateString(start, days)}`;
}

export function InfirmierPlanningScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [tab, setTab] = useState<TabKey>('semaine');
  const [weekStart, setWeekStart] = useState(setCurrentMonday());
  const [gardes, setGardes] = useState<GardeRecord[]>([]);
  const [plannings, setPlannings] = useState<PlanningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PlanningRecord | null>(null);
  const [detailGardes, setDetailGardes] = useState<GardeRecord[]>([]);

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekEnd = weekDays.length ? weekDays[weekDays.length - 1].date : weekStart;

  const weekGardes = useMemo(() => {
    return gardes.filter((g) => {
      const d = g.debut?.slice(0, 10);
      return d && d >= weekStart && d <= weekEnd;
    });
  }, [gardes, weekStart, weekEnd]);

  const weekGrid = useMemo(() => buildDetailByShift(weekDays, weekGardes), [weekDays, weekGardes]);
  const detailWeekDays = useMemo(
    () => buildWeekDays(detail?.date ?? detail?.dateDebut ?? ''),
    [detail],
  );
  const detailGrid = useMemo(
    () => buildDetailByShift(detailWeekDays, detailGardes),
    [detailWeekDays, detailGardes],
  );

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [g, p] = await Promise.all([
        planningService.gardesByUtilisateur(userId),
        planningService.listByUtilisateur(userId),
      ]);
      setGardes(g ?? []);
      setPlannings(p ?? []);
    } catch {
      setGardes([]);
      setPlannings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  function shiftWeek(delta: number) {
    setWeekStart((prev) => addDaysToDateString(prev, delta * 7));
  }

  async function openDetail(item: PlanningRecord) {
    setDetail(item);
    try {
      const g = await planningService.gardesByPlanning(item.id);
      const mine = (g ?? []).filter((x) => x.utilisateur?.id === userId);
      setDetailGardes(mine.length ? mine : g ?? []);
    } catch {
      setDetailGardes([]);
    }
  }

  async function telechargerPdfSemaine() {
    if (!userId || !weekStart || !weekEnd) return;
    try {
      const uri = await planningService.downloadUtilisateurWeekPdf(
        userId,
        weekStart,
        weekEnd,
        `mon-planning-${weekStart}.pdf`,
      );
      if (Platform.OS === 'web') window.open(uri, '_blank');
      else await Linking.openURL(uri);
    } catch {
      try {
        const last = plannings[0];
        if (last?.id) {
          const uri = await planningService.downloadPlanningPdf(
            last.id,
            `planning-${last.id}.pdf`,
            { utilisateurId: String(userId) },
          );
          if (Platform.OS === 'web') window.open(uri, '_blank');
          else await Linking.openURL(uri);
          return;
        }
      } catch {
        /* ignore */
      }
      Alert.alert('PDF', 'Téléchargement impossible.');
    }
  }

  async function telechargerPdfPlanning(item: PlanningRecord) {
    if (!userId) return;
    try {
      const uri = await planningService.downloadPlanningPdf(
        item.id,
        `planning-${item.id}.pdf`,
        { utilisateurId: String(userId) },
      );
      if (Platform.OS === 'web') window.open(uri, '_blank');
      else await Linking.openURL(uri);
    } catch {
      Alert.alert('PDF', 'Téléchargement impossible.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Mon planning" subtitle="Gardes et plannings" />
      <View style={styles.tabsWrap}>
        <SegmentTabs<TabKey>
          options={[
            { key: 'semaine', label: 'Semaine' },
            { key: 'historique', label: 'Historique' },
          ]}
          value={tab}
          onChange={setTab}
          onDark={false}
        />
      </View>
      {loading ? <LoadingOverlay /> : null}

      {tab === 'semaine' ? (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
          }
        >
          <View style={styles.weekNav}>
            <Pressable onPress={() => shiftWeek(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={LUNA_COLORS.secondary} />
            </Pressable>
            <Text style={styles.weekLabel}>Semaine du {weekStart}</Text>
            <Pressable onPress={() => shiftWeek(1)} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={LUNA_COLORS.secondary} />
            </Pressable>
          </View>
          <Button title="Télécharger PDF" variant="ghost" onPress={() => void telechargerPdfSemaine()} />

          {weekDays.map((day: WeekDay) => (
            <View key={day.date} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{day.label} {day.date}</Text>
              <Text style={styles.shiftLine}>
                Matin : {(weekGrid[day.date]?.matin ?? []).join(', ') || '—'}
              </Text>
              <Text style={styles.shiftLine}>
                Après-midi : {(weekGrid[day.date]?.soir ?? []).join(', ') || '—'}
              </Text>
              <Text style={styles.shiftLine}>
                Nuit : {(weekGrid[day.date]?.nuit ?? []).join(', ') || '—'}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={plannings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.type ?? 'Planning'}</Text>
              <Text style={styles.cardMeta}>{planningPeriod(item)}</Text>
              <Text style={styles.cardMeta}>{item.valide ? 'Validé' : 'En attente'}</Text>
              <View style={styles.rowActions}>
                <Button title="Détail" size="sm" onPress={() => void openDetail(item)} />
                <Button title="PDF" size="sm" variant="ghost" onPress={() => void telechargerPdfPlanning(item)} />
              </View>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState icon="calendar-outline" title="Aucun planning" subtitle="Vos plannings apparaîtront ici." />
            ) : null
          }
        />
      )}

      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Détail</Text>
            <Pressable onPress={() => setDetail(null)}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.dark} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            {detail ? (
              <>
                <Text style={styles.cardTitle}>{planningPeriod(detail)}</Text>
                {detailWeekDays.map((day) => (
                  <View key={day.date} style={styles.dayCard}>
                    <Text style={styles.dayTitle}>{day.label} {day.date}</Text>
                    <Text style={styles.shiftLine}>Matin : {(detailGrid[day.date]?.matin ?? []).join(', ') || '—'}</Text>
                    <Text style={styles.shiftLine}>Après-midi : {(detailGrid[day.date]?.soir ?? []).join(', ') || '—'}</Text>
                    <Text style={styles.shiftLine}>Nuit : {(detailGrid[day.date]?.nuit ?? []).join(', ') || '—'}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  tabsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  body: { padding: spacing.lg, paddingBottom: 80 },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  navBtn: { padding: spacing.sm },
  weekLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  dayCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  dayTitle: { fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.xs },
  shiftLine: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  cardMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  rowActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modal: { flex: 1, backgroundColor: LUNA_COLORS.background },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
});
