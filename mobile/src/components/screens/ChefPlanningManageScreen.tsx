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
  TextInput,
  View,
} from 'react-native';

import { personnelService } from '@/src/api/services/personnel.service';
import { planningService, type GardeRecord, type PlanningRecord } from '@/src/api/services/planning.service';
import { chefPersonnelService, type ServiceMedical } from '@/src/api/services/chef-personnel.service';
import {
  Button,
  EmptyState,
  LoadingOverlay,
  LunaHeroHeader,
  LunaScreen,
  SegmentTabs,
} from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import type { PersonnelMember } from '@/src/types/personnel';
import {
  addDaysToDateString,
  buildDetailByShift,
  buildWeekDays,
  setNextMonday,
  validateInfirmierPlanning,
  type ShiftValue,
  type WeekDay,
} from '@/src/utils/planning.utils';

type TabKey = 'history' | 'create';

const SHIFT_CYCLE: ShiftValue[] = ['', 'MATIN', 'APRES_MIDI', 'NUIT'];

function planningPeriod(p: PlanningRecord): string {
  const start = p.date ?? p.dateDebut;
  if (!start) return '—';
  const days = p.type === 'MENSUEL' ? 29 : 6;
  return `${start} → ${addDaysToDateString(start, days)}`;
}

function planningUsers(p: PlanningRecord): string {
  const names = (p.utilisateurs ?? [])
    .map((u) => `${u.prenom ?? ''} ${u.nom ?? ''}`.trim())
    .filter(Boolean);
  return names.length ? names.join(', ') : '—';
}

export function ChefPlanningManageScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const userId = useAuthStore((s) => s.userId);
  const [tab, setTab] = useState<TabKey>('history');
  const [liste, setListe] = useState<PlanningRecord[]>([]);
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [infirmiers, setInfirmiers] = useState<PersonnelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [typePlanning, setTypePlanning] = useState<'HEBDOMADAIRE' | 'MENSUEL'>('HEBDOMADAIRE');
  const [dateDebut, setDateDebut] = useState(setNextMonday());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shiftSelections, setShiftSelections] = useState<Record<string, Record<string, ShiftValue>>>({});

  const [detail, setDetail] = useState<PlanningRecord | null>(null);
  const [detailGardes, setDetailGardes] = useState<GardeRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const weekDays = useMemo(() => buildWeekDays(dateDebut), [dateDebut]);
  const detailWeekDays = useMemo(
    () => buildWeekDays(detail?.date ?? detail?.dateDebut ?? ''),
    [detail],
  );
  const detailGrid = useMemo(
    () => buildDetailByShift(detailWeekDays, detailGardes),
    [detailWeekDays, detailGardes],
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [plannings, svcs, infs] = await Promise.all([
        planningService.listAll(),
        cliniqueId ? chefPersonnelService.servicesByClinique(cliniqueId) : Promise.resolve([]),
        cliniqueId ? personnelService.listByRole('INFIRMIER', cliniqueId) : Promise.resolve([]),
      ]);
      setListe(Array.isArray(plannings) ? plannings : []);
      setServices(Array.isArray(svcs) ? svcs.filter((s) => s.actif !== false) : []);
      setInfirmiers(Array.isArray(infs) ? infs.filter((i) => i.actif !== false) : []);
    } catch {
      setListe([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleInfirmier(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setShiftSelections((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function cycleShift(infirmierId: string, date: string) {
    setShiftSelections((prev) => {
      const current = prev[infirmierId]?.[date] ?? '';
      const idx = SHIFT_CYCLE.indexOf(current);
      const nextShift = SHIFT_CYCLE[(idx + 1) % SHIFT_CYCLE.length];
      const row = { ...(prev[infirmierId] ?? {}) };
      if (nextShift) row[date] = nextShift;
      else delete row[date];
      return { ...prev, [infirmierId]: row };
    });
  }

  function getAssignedDates(infirmierId: string): string[] {
    return weekDays.map((d) => d.date).filter((date) => !!shiftSelections[infirmierId]?.[date]);
  }

  function validateCreate(): string | null {
    if (!dateDebut || weekDays.length === 0) return 'Date de début obligatoire.';
    if (!selectedServiceId) return 'Sélectionnez un service.';
    if (selectedIds.size === 0) return 'Sélectionnez au moins un infirmier.';
    for (const id of selectedIds) {
      const dates = getAssignedDates(id);
      const shifts = dates.map((d) => shiftSelections[id]?.[d]).filter(Boolean) as string[];
      const err = validateInfirmierPlanning(dates, shifts);
      if (err) return err;
    }
    return null;
  }

  async function creerPlanning() {
    const err = validateCreate();
    if (err) {
      Alert.alert('Planning', err);
      return;
    }
    if (!userId) {
      Alert.alert('Erreur', 'Session invalide.');
      return;
    }
    setSaving(true);
    try {
      const utilisateurIds = Array.from(selectedIds);
      const dateFin = addDaysToDateString(dateDebut, typePlanning === 'MENSUEL' ? 29 : 6);
      const existing = await planningService.listByPeriode(dateDebut, dateFin);
      const conflict = (existing ?? []).some((p) => {
        const start = p.date ?? p.dateDebut;
        if (p.type !== typePlanning || start !== dateDebut) return false;
        return (p.utilisateurs ?? []).some((u) => u.id && selectedIds.has(u.id));
      });
      if (conflict) {
        Alert.alert('Conflit', 'Certains infirmiers ont déjà un planning pour cette période.');
        return;
      }

      const payload = { dateDebut, utilisateurIds, createurId: String(userId) };
      const planning =
        typePlanning === 'MENSUEL'
          ? await planningService.createMensuel(payload)
          : await planningService.createHebdo(payload);

      const planningId = planning?.id;
      const calls: Promise<unknown>[] = [];
      for (const infId of utilisateurIds) {
        for (const day of weekDays) {
          const shift = shiftSelections[infId]?.[day.date];
          if (!shift) continue;
          if (shift === 'NUIT') {
            calls.push(
              planningService.creerGardeNuit({
                utilisateurId: infId,
                dateDebut: day.date,
                planningId,
                serviceId: selectedServiceId,
              }),
            );
          } else {
            calls.push(
              planningService.creerShiftJour({
                utilisateurId: infId,
                date: day.date,
                matin: shift === 'MATIN',
                planningId,
                serviceId: selectedServiceId,
              }),
            );
          }
        }
      }
      await Promise.all(calls);
      Alert.alert('Succès', 'Planning créé avec succès.');
      setSelectedIds(new Set());
      setShiftSelections({});
      setTab('history');
      await load(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Création impossible');
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(item: PlanningRecord) {
    setDetail(item);
    setDetailLoading(true);
    try {
      const [p, g] = await Promise.all([
        planningService.getById(item.id),
        planningService.gardesByPlanning(item.id),
      ]);
      setDetail(p);
      setDetailGardes(g ?? []);
    } catch {
      setDetailGardes([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function validerPlanning(id: string) {
    try {
      await planningService.valider(id);
      Alert.alert('Succès', 'Planning validé.');
      setDetail(null);
      await load(true);
    } catch {
      Alert.alert('Erreur', 'Validation impossible.');
    }
  }

  async function telechargerPdf(item: PlanningRecord, utilisateurId?: string) {
    try {
      const uri = await planningService.downloadPlanningPdf(
        item.id,
        `planning-${item.id}.pdf`,
        { serviceId: selectedServiceId || undefined, utilisateurId },
      );
      if (Platform.OS === 'web') {
        window.open(uri, '_blank');
      } else {
        await Linking.openURL(uri);
      }
    } catch {
      Alert.alert('PDF', 'Téléchargement impossible.');
    }
  }

  if (loading && tab === 'history') return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Planning infirmiers" subtitle="Création et historique" showBack={false} />
      <View style={styles.tabsWrap}>
        <SegmentTabs<TabKey>
          options={[
            { key: 'history', label: 'Historique' },
            { key: 'create', label: 'Créer' },
          ]}
          value={tab}
          onChange={setTab}
          onDark={false}
        />
      </View>

      {tab === 'history' ? (
        <FlatList
          data={liste}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.type ?? 'Planning'} — {planningPeriod(item)}</Text>
              <Text style={styles.cardMeta}>{planningUsers(item)}</Text>
              <View style={[styles.badge, item.valide ? styles.badgeOk : styles.badgePending]}>
                <Text style={[styles.badgeText, item.valide ? styles.badgeOkText : styles.badgePendingText]}>
                  {item.valide ? 'Validé' : 'En attente'}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button title="Détail" size="sm" onPress={() => void openDetail(item)} />
                {!item.valide ? (
                  <Button title="Valider" size="sm" variant="ghost" onPress={() => void validerPlanning(item.id)} />
                ) : null}
                <Button title="PDF" size="sm" variant="ghost" onPress={() => void telechargerPdf(item)} />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="Aucun planning" subtitle="Créez un planning dans l'onglet Créer." />
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.createBody}>
          <Text style={styles.label}>Service</Text>
          <View style={styles.chips}>
            {services.map((s) => (
              <Pressable
                key={String(s.id)}
                style={[styles.chip, selectedServiceId === String(s.id) && styles.chipOn]}
                onPress={() => setSelectedServiceId(String(s.id))}
              >
                <Text style={[styles.chipText, selectedServiceId === String(s.id) && styles.chipTextOn]}>{s.nom}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Type</Text>
          <View style={styles.row}>
            {(['HEBDOMADAIRE', 'MENSUEL'] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, typePlanning === t && styles.chipOn]}
                onPress={() => setTypePlanning(t)}
              >
                <Text style={[styles.chipText, typePlanning === t && styles.chipTextOn]}>
                  {t === 'HEBDOMADAIRE' ? 'Hebdomadaire' : 'Mensuel'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Date de début (lundi)</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} value={dateDebut} onChangeText={setDateDebut} placeholder="YYYY-MM-DD" />
            <Pressable style={styles.chip} onPress={() => setDateDebut(setNextMonday())}>
              <Text style={styles.chipText}>Semaine prochaine</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Infirmiers</Text>
          {infirmiers.map((inf) => {
            const id = String(inf.id);
            const selected = selectedIds.has(id);
            return (
              <View key={id} style={styles.infBlock}>
                <Pressable style={styles.infHead} onPress={() => toggleInfirmier(id)}>
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? LUNA_COLORS.secondary : LUNA_COLORS.textSecondary}
                  />
                  <Text style={styles.infName}>{inf.prenom} {inf.nom}</Text>
                </Pressable>
                {selected ? (
                  <View style={styles.daysGrid}>
                    {weekDays.map((day: WeekDay) => {
                      const shift = shiftSelections[id]?.[day.date] ?? '';
                      return (
                        <Pressable key={day.date} style={styles.dayCell} onPress={() => cycleShift(id, day.date)}>
                          <Text style={styles.dayLabel}>{day.label}</Text>
                          <Text style={styles.dayShift}>{shift ? shift.replace('_', ' ') : 'Repos'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}

          <Text style={styles.hint}>
            Appuyez sur un jour pour alterner : Repos → Matin → Après-midi → Nuit. Règle : 6 jours sans nuit OU 3 nuits.
          </Text>
          <Button title={saving ? 'Création…' : 'Créer le planning'} onPress={() => void creerPlanning()} disabled={saving} />
        </ScrollView>
      )}

      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Détail planning</Text>
            <Pressable onPress={() => setDetail(null)}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.dark} />
            </Pressable>
          </View>
          {detailLoading ? <LoadingOverlay /> : null}
          {detail ? (
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.cardTitle}>{planningPeriod(detail)}</Text>
              <Text style={styles.cardMeta}>{planningUsers(detail)}</Text>
              {detailWeekDays.map((day) => (
                <View key={day.date} style={styles.detailDay}>
                  <Text style={styles.detailDayTitle}>{day.label} {day.date}</Text>
                  <Text style={styles.detailLine}>Matin : {(detailGrid[day.date]?.matin ?? []).join(', ') || '—'}</Text>
                  <Text style={styles.detailLine}>Après-midi : {(detailGrid[day.date]?.soir ?? []).join(', ') || '—'}</Text>
                  <Text style={styles.detailLine}>Nuit : {(detailGrid[day.date]?.nuit ?? []).join(', ') || '—'}</Text>
                </View>
              ))}
              <View style={styles.actions}>
                {!detail.valide ? (
                  <Button title="Valider" onPress={() => void validerPlanning(detail.id)} />
                ) : null}
                <Button title="PDF" variant="ghost" onPress={() => void telechargerPdf(detail)} />
                {(detail.utilisateurs ?? []).map((u) => (
                  <Button
                    key={u.id}
                    title={`PDF ${u.prenom ?? ''}`}
                    size="sm"
                    variant="ghost"
                    onPress={() => void telechargerPdf(detail, u.id)}
                  />
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  cardMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  badgeOk: { backgroundColor: LUNA_COLORS.successLight },
  badgeOkText: { color: LUNA_COLORS.success },
  badgePending: { backgroundColor: LUNA_COLORS.warningLight },
  badgePendingText: { color: LUNA_COLORS.warning },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  createBody: { padding: spacing.lg, paddingBottom: 80, gap: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, marginTop: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minWidth: 140,
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  chipOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  chipTextOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  infBlock: { marginTop: spacing.sm, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, borderRadius: borderRadius.md },
  infHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  infName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm, gap: spacing.xs },
  dayCell: {
    width: '30%',
    minWidth: 96,
    padding: spacing.sm,
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  dayLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  dayShift: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary, marginTop: 2 },
  hint: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, lineHeight: 18 },
  modal: { flex: 1, backgroundColor: LUNA_COLORS.background, paddingTop: spacing.xxxl },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  modalBody: { padding: spacing.lg, paddingBottom: 80 },
  detailDay: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  detailDayTitle: { fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.xs },
  detailLine: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
});
