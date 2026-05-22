/**
 * AgendaScreen — Planning hebdo + gestion complète des RDV
 * Fusionne planning.tsx et rendez-vous.tsx en deux onglets.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { MEDECINS, PATIENTS, RDV } from '@/src/api/endpoints';
import { Badge, EmptyState, SegmentTabs } from '@/src/components/common';
import type { BadgeColor } from '@/src/components/common';
import { hasMedecinClinique, isMedecinCabinet } from '@/src/utils/medecinContext';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types partagés ────────────────────────────────────────────────────────────
type RdvStatut = 'PLANIFIE' | 'CONFIRME' | 'ARRIVE' | 'ANNULE' | 'TERMINE';

interface RdvItem {
  id: string | number;
  dateHeure: string;
  statut: RdvStatut;
  motif?: string;
  typeRdv?: string;
  patientId: string;
  patientNom: string;
  patientPrenom: string;
}

interface Patient {
  id: string;
  nom: string;
  prenom: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateWeekDays(): { label: string; value: string }[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.toISOString().slice(0, 10),
    };
  });
}

function extractTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDT(dt: string): string {
  return new Date(dt).toLocaleString('fr-TN', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

const WEEK_DAYS = generateWeekDays();

const STATUT_CONFIG: Record<RdvStatut, { label: string; color: BadgeColor }> = {
  PLANIFIE: { label: 'Planifié',  color: 'warning'   },
  CONFIRME: { label: 'Confirmé',  color: 'success'   },
  ARRIVE:   { label: 'Arrivé',    color: 'info'      },
  ANNULE:   { label: 'Annulé',    color: 'error'     },
  TERMINE:  { label: 'Terminé',   color: 'secondary' },
};

const STATUT_COLOR: Record<RdvStatut, string> = {
  PLANIFIE: LUNA_COLORS.accentOrange,
  CONFIRME: '#3B82F6',
  ARRIVE:   LUNA_COLORS.success,
  ANNULE:   '#EF4444',
  TERMINE:  LUNA_COLORS.tertiary,
};

// ── Bottom sheet (planning tab) ───────────────────────────────────────────────
function BottomSheet({
  visible, onClose, children,
}: {
  visible: boolean; onClose: () => void; children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={bs.backdrop}>
        <Pressable style={bs.overlayTap} onPress={onClose} />
        <View style={bs.sheet}>
          <View style={bs.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const bs = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'flex-end' },
  overlayTap:  { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.huge,
    ...(shadows.xl as object),
  },
  handle: {
    width: 40, height: 4, borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.borderDark,
    alignSelf: 'center', marginBottom: spacing.lg,
  },
});

// ── Tab 1 : Planning hebdomadaire ─────────────────────────────────────────────
function PlanningTab(): React.JSX.Element {
  const router     = useRouter();
  const medecinId  = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [selectedDate, setSelectedDate] = useState(WEEK_DAYS[0].value);
  const [rdvs,         setRdvs]         = useState<RdvItem[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [selectedRdv,  setSelectedRdv]  = useState<RdvItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const loadRdvs = useCallback(async (date: string, silent = false) => {
    if (!medecinId) return;
    if (!silent) setLoading(true);
    try {
      const url = cliniqueId
        ? `${RDV.BY_CLINIQUE(cliniqueId)}?date=${date}`
        : `${RDV.BY_MEDECIN(medecinId)}?date=${date}`;
      const data = await apiGet<RdvItem[]>(url);
      setRdvs([...data].sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()));
    } catch {
      setRdvs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId, cliniqueId]);

  useEffect(() => { loadRdvs(selectedDate); }, [selectedDate, loadRdvs]);

  function openSheet(rdv: RdvItem) { setSelectedRdv(rdv); setSheetVisible(true); }
  function closeSheet() { setSheetVisible(false); setSelectedRdv(null); }

  function renderRdvCard({ item }: { item: RdvItem }) {
    const cfg = STATUT_CONFIG[item.statut];
    return (
      <Pressable onPress={() => openSheet(item)}>
        <View style={planStyles.card}>
          <View style={planStyles.leftBar} />
          <View style={planStyles.content}>
            <View style={planStyles.topRow}>
              <Text style={planStyles.time}>{extractTime(item.dateHeure)}</Text>
              <Badge label={cfg.label} color={cfg.color} />
            </View>
            <Text style={planStyles.patientName}>{item.patientPrenom} {item.patientNom}</Text>
            {item.motif ? <Text style={planStyles.motif} numberOfLines={1}>{item.motif}</Text> : null}
            {item.typeRdv ? <Text style={planStyles.type}>{item.typeRdv}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Sélecteur jours */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={planStyles.weekScroll} contentContainerStyle={planStyles.weekContent}
      >
        {WEEK_DAYS.map((day) => {
          const active = selectedDate === day.value;
          return (
            <Pressable
              key={day.value}
              onPress={() => setSelectedDate(day.value)}
              style={[planStyles.dayChip, active && planStyles.dayChipActive]}
            >
              <Text style={[planStyles.dayTxt, active && planStyles.dayTxtActive]}>{day.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={rdvs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRdvCard}
          contentContainerStyle={planStyles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadRdvs(selectedDate, true); }}
              tintColor={LUNA_COLORS.secondary}
              colors={[LUNA_COLORS.secondary]}
            />
          }
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="Aucun rendez-vous" subtitle="Pas de consultation ce jour-là." />
          }
        />
      )}

      {/* BottomSheet détails */}
      <BottomSheet visible={sheetVisible} onClose={closeSheet}>
        {selectedRdv ? (
          <View>
            <View style={sheetStyles.patientRow}>
              <View style={sheetStyles.avatar}>
                <Text style={sheetStyles.avatarTxt}>
                  {getInitials(selectedRdv.patientNom, selectedRdv.patientPrenom)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.patientName}>{selectedRdv.patientPrenom} {selectedRdv.patientNom}</Text>
                <Text style={sheetStyles.time}>{extractTime(selectedRdv.dateHeure)}</Text>
              </View>
              <Badge label={STATUT_CONFIG[selectedRdv.statut].label} color={STATUT_CONFIG[selectedRdv.statut].color} />
            </View>
            {selectedRdv.motif ? <Text style={sheetStyles.motif}>{selectedRdv.motif}</Text> : null}
            <View style={sheetStyles.actions}>
              <Pressable
                style={[sheetStyles.btn, { backgroundColor: LUNA_COLORS.secondary }]}
                onPress={() => {
                  closeSheet();
                  router.push(`/(medecin)/patients/${selectedRdv.patientId}/consultation?rdvId=${selectedRdv.id}` as never);
                }}
              >
                <Text style={sheetStyles.btnTxt}>Consulter</Text>
              </Pressable>
              <Pressable
                style={[sheetStyles.btn, { backgroundColor: LUNA_COLORS.surfaceDark ?? LUNA_COLORS.background }]}
                onPress={() => {
                  closeSheet();
                  router.push(`/(medecin)/patients/${selectedRdv.patientId}/dossier` as never);
                }}
              >
                <Text style={[sheetStyles.btnTxt, { color: LUNA_COLORS.dark }]}>Dossier</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const planStyles = StyleSheet.create({
  weekScroll:   { flexGrow: 0 },
  weekContent:  { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  dayChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.background,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  dayChipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  dayTxt:        { fontSize: fontSize.xs, color: LUNA_COLORS.dark },
  dayTxtActive:  { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  listContent:   { padding: spacing.md, paddingBottom: 80 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.xs as object),
  },
  leftBar:     { width: 4, height: '100%', borderRadius: 2, backgroundColor: LUNA_COLORS.secondary },
  content:     { flex: 1 },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  time:        { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: LUNA_COLORS.secondary },
  patientName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  motif:       { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  type:        { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
});

const sheetStyles = StyleSheet.create({
  patientRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: LUNA_COLORS.secondary, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt:   { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  patientName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  time:        { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  motif:       { fontSize: fontSize.sm, color: LUNA_COLORS.dark, marginBottom: spacing.lg },
  actions:     { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  btnTxt: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});

// ── Tab 2 : Gestion des rendez-vous ──────────────────────────────────────────
function RendezVousTab({ scope }: { scope?: 'clinique' | 'cabinet' }): React.JSX.Element {
  const userId     = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const estCabinet = useAuthStore((s) => s.estCabinet);

  const isCabinetScope = scope === 'cabinet'
    || (scope !== 'clinique' && isMedecinCabinet(estCabinet, cliniqueId) && !hasMedecinClinique(cliniqueId));

  const [items,          setItems]        = useState<RdvItem[]>([]);
  const [loading,        setLoading]      = useState(true);
  const [refreshing,     setRefreshing]   = useState(false);
  const [error,          setError]        = useState<string | null>(null);
  const [showModal,      setShowModal]    = useState(false);
  // Form
  const [patients,        setPatientsSugg] = useState<Patient[]>([]);
  const [patientSearch,   setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dateHeure,       setDateHeure]    = useState('');
  const [motif,           setMotif]        = useState('');
  const [typeRdv,         setTypeRdv]      = useState('CONSULTATION');
  const [submitting,      setSubmitting]   = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const url = isCabinetScope
        ? RDV.BY_MEDECIN_CABINET(userId)
        : hasMedecinClinique(cliniqueId)
          ? RDV.BY_MEDECIN_CLINIQUE(userId, cliniqueId!)
          : RDV.BY_MEDECIN(userId);
      const data = await apiGet<RdvItem[]>(url);
      setItems((data ?? []).sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()));
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, cliniqueId, isCabinetScope]);

  useEffect(() => { void load(); }, [load]);

  // Recherche patients pour formulaire
  useEffect(() => {
    if (patientSearch.length < 2) { setPatientsSugg([]); return; }
    let cancelled = false;
    const fetch = async () => {
      try {
        const source = isCabinetScope
          ? await apiGet<Patient[]>(`${MEDECINS.PATIENTS_LIST(userId!)}?scope=cabinet`)
          : hasMedecinClinique(cliniqueId)
            ? await apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId!))
            : await apiGet<Patient[]>(MEDECINS.PATIENTS_LIST(userId!));
        if (!cancelled) {
          const kw = patientSearch.toLowerCase();
          setPatientsSugg(
            (source ?? []).filter((p) =>
              p.nom.toLowerCase().includes(kw) || p.prenom.toLowerCase().includes(kw),
            ).slice(0, 8),
          );
        }
      } catch { if (!cancelled) setPatientsSugg([]); }
    };
    void fetch();
    return () => { cancelled = true; };
  }, [patientSearch, cliniqueId, userId, isCabinetScope]);

  async function handleConfirmer(id: string | number) {
    try { await apiPatch(RDV.CONFIRMER_MEDECIN(id), {}); void load(true); } catch { /* ignore */ }
  }
  async function handleAnnuler(id: string | number) {
    try { await apiPatch(RDV.ANNULER(id), {}); void load(true); } catch { /* ignore */ }
  }

  async function handleCreate() {
    if (!selectedPatient || !dateHeure || !userId) return;
    setSubmitting(true);
    try {
      await apiPost(RDV.CREATE, { medecinId: userId, patientId: selectedPatient.id, dateHeure, motif, typeRdv });
      setShowModal(false);
      setSelectedPatient(null);
      setDateHeure('');
      setMotif('');
      void load(true);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  const renderItem = ({ item }: { item: RdvItem }) => (
    <View style={rdvStyles.card}>
      <View style={rdvStyles.cardHeader}>
        <Text style={rdvStyles.patientName}>{item.patientPrenom} {item.patientNom}</Text>
        <View style={[rdvStyles.badge, { backgroundColor: STATUT_COLOR[item.statut] + '22' }]}>
          <Text style={[rdvStyles.badgeText, { color: STATUT_COLOR[item.statut] }]}>
            {STATUT_CONFIG[item.statut].label}
          </Text>
        </View>
      </View>
      <Text style={rdvStyles.dateText}>{formatDT(item.dateHeure)}</Text>
      {item.motif ? <Text style={rdvStyles.motifText}>{item.motif}</Text> : null}
      {item.typeRdv ? <Text style={rdvStyles.typeText}>{item.typeRdv}</Text> : null}
      {item.statut === 'PLANIFIE' && (
        <View style={rdvStyles.actions}>
          <TouchableOpacity
            style={[rdvStyles.actionBtn, { backgroundColor: '#3B82F620' }]}
            onPress={() => handleConfirmer(item.id)}
          >
            <Text style={[rdvStyles.actionTxt, { color: '#3B82F6' }]}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[rdvStyles.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => handleAnnuler(item.id)}
          >
            <Text style={[rdvStyles.actionTxt, { color: '#EF4444' }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      {error ? (
        <View style={rdvStyles.errorBanner}><Text style={rdvStyles.errorText}>{error}</Text></View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={rdvStyles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(true); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="Aucun rendez-vous" subtitle="Aucun RDV enregistré." />
        }
      />

      <Pressable style={rdvStyles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color={LUNA_COLORS.textInverse} />
      </Pressable>

      {/* Modal création */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={rdvStyles.overlay}>
          <View style={rdvStyles.modal}>
            <View style={rdvStyles.modalHeader}>
              <Text style={rdvStyles.modalTitle}>Nouveau rendez-vous</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={LUNA_COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={rdvStyles.modalBody}>
              <Text style={rdvStyles.label}>Patient *</Text>
              <TextInput
                style={rdvStyles.input}
                placeholder="Rechercher un patient..."
                placeholderTextColor={LUNA_COLORS.tertiary}
                value={selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : patientSearch}
                onChangeText={(t) => { setPatientSearch(t); setSelectedPatient(null); }}
              />
              {patients.length > 0 && !selectedPatient && (
                <View style={rdvStyles.suggestions}>
                  {patients.map((p) => (
                    <TouchableOpacity
                      key={p.id} style={rdvStyles.suggestion}
                      onPress={() => { setSelectedPatient(p); setPatientsSugg([]); }}
                    >
                      <Text style={rdvStyles.suggestionText}>{p.prenom} {p.nom}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={rdvStyles.label}>Date et heure * (YYYY-MM-DDTHH:mm)</Text>
              <TextInput
                style={rdvStyles.input}
                placeholder="2026-05-15T09:00"
                placeholderTextColor={LUNA_COLORS.tertiary}
                value={dateHeure} onChangeText={setDateHeure}
              />

              <Text style={rdvStyles.label}>Motif</Text>
              <TextInput
                style={[rdvStyles.input, rdvStyles.textarea]}
                placeholder="Motif du rendez-vous..."
                placeholderTextColor={LUNA_COLORS.tertiary}
                value={motif} onChangeText={setMotif}
                multiline numberOfLines={3}
              />

              <Text style={rdvStyles.label}>Type</Text>
              {(['CONSULTATION', 'SUIVI', 'URGENCE', 'TELECONSULTATION'] as const).map((t) => (
                <TouchableOpacity
                  key={t} style={[rdvStyles.chip, typeRdv === t && rdvStyles.chipSelected]}
                  onPress={() => setTypeRdv(t)}
                >
                  <Text style={[rdvStyles.chipText, typeRdv === t && rdvStyles.chipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[rdvStyles.submitBtn, (!selectedPatient || !dateHeure || submitting) && rdvStyles.submitBtnDisabled]}
                onPress={handleCreate}
                disabled={!selectedPatient || !dateHeure || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={rdvStyles.submitText}>Créer le rendez-vous</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rdvStyles = StyleSheet.create({
  list:         { padding: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm,
    ...(shadows.sm as object),
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  patientName:  { color: LUNA_COLORS.dark, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  badge:        { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  badgeText:    { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  dateText:     { color: LUNA_COLORS.tertiary, fontSize: fontSize.sm, marginBottom: 2 },
  motifText:    { color: LUNA_COLORS.dark, fontSize: fontSize.sm, marginBottom: 2 },
  typeText:     { color: LUNA_COLORS.secondary, fontSize: fontSize.xs },
  actions:      { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn:    { flex: 1, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, alignItems: 'center' },
  actionTxt:    { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  errorBanner:  { backgroundColor: '#EF444420', padding: spacing.sm, marginHorizontal: spacing.md },
  errorText:    { color: '#EF4444', fontSize: fontSize.sm, textAlign: 'center' },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
    ...(shadows.lg as object),
  },
  overlay:      { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.background,
  },
  modalTitle:       { color: LUNA_COLORS.dark, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  modalBody:        { padding: spacing.lg },
  label:            { color: LUNA_COLORS.tertiary, fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: LUNA_COLORS.inputBg, borderRadius: borderRadius.md,
    padding: spacing.md, color: LUNA_COLORS.dark, fontSize: fontSize.sm,
    borderWidth: 1, borderColor: LUNA_COLORS.borderInput,
  },
  textarea:         { minHeight: 72, textAlignVertical: 'top' },
  suggestions:      { backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.sm, marginTop: 2 },
  suggestion:       { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.surface },
  suggestionText:   { color: LUNA_COLORS.dark, fontSize: fontSize.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, backgroundColor: LUNA_COLORS.background,
    marginBottom: spacing.xs, borderWidth: 1, borderColor: LUNA_COLORS.surface,
  },
  chipSelected:     { backgroundColor: LUNA_COLORS.secondary + '22', borderColor: LUNA_COLORS.secondary },
  chipText:         { color: LUNA_COLORS.tertiary, fontSize: fontSize.sm },
  chipTextSelected: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  submitBtn: {
    backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.full,
    padding: spacing.md, minHeight: 48, alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText:       { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
});

// ── Composant exporté ─────────────────────────────────────────────────────────
export interface AgendaScreenProps {
  /** Onglet ouvert par défaut */
  initialTab?: 'planning' | 'rdv';
  /** Scope clinique ou cabinet pour les RDV */
  scope?: 'clinique' | 'cabinet';
}

export function AgendaScreen({ initialTab = 'planning', scope }: AgendaScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState(initialTab);
  const title = scope === 'cabinet' ? 'Rendez-vous cabinet' : scope === 'clinique' ? 'Rendez-vous clinique' : 'Agenda';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <View style={agendaStyles.header}>
        <Text style={agendaStyles.title}>{title}</Text>
        <Text style={agendaStyles.sub}>Planning & rendez-vous</Text>
      </View>
      <SegmentTabs<'planning' | 'rdv'>
        options={[
          { key: 'planning', label: 'Planning'     },
          { key: 'rdv',      label: 'Rendez-vous'  },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        onDark={false}
      />
      {activeTab === 'planning' ? <PlanningTab /> : <RendezVousTab scope={scope} />}
    </SafeAreaView>
  );
}

const agendaStyles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub:   { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
});
