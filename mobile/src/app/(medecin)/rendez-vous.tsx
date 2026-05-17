import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { MEDECINS, PATIENTS, RDV } from '@/src/api/endpoints';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { hasMedecinClinique } from '@/src/utils/medecinContext';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type RdvStatut = 'PLANIFIE' | 'CONFIRME' | 'ARRIVE' | 'ANNULE' | 'TERMINE';

interface RendezVous {
  id:            string | number;
  dateHeure:     string;
  motif:         string;
  typeRdv:       string;
  statut:        RdvStatut;
  patientId:     string | number;
  patientNom:    string;
  patientPrenom: string;
  medecinId:     string | number;
  medecinNom:    string;
  medecinPrenom: string;
}

interface Patient {
  id: string;
  nom: string;
  prenom: string;
}

const STATUT_COLOR: Record<RdvStatut, string> = {
  PLANIFIE: LUNA_COLORS.accentOrange,
  CONFIRME: '#3B82F6',
  ARRIVE:   LUNA_COLORS.success,
  ANNULE:   '#EF4444',
  TERMINE:  LUNA_COLORS.tertiary,
};
const STATUT_LABEL: Record<RdvStatut, string> = {
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  ARRIVE:   'Arrivé',
  ANNULE:   'Annulé',
  TERMINE:  'Terminé',
};

// ── Utilitaire ────────────────────────────────────────────────────────────────
function formatDT(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleString('fr-TN', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function MedecinRendezVousScreen(): React.JSX.Element {
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const userId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const scope = useMemo<'clinique' | 'cabinet'>(() => {
    if (scopeParam === 'clinique' || scopeParam === 'cabinet') return scopeParam;
    if (hasMedecinClinique(cliniqueId)) return 'clinique';
    return 'cabinet';
  }, [scopeParam, cliniqueId]);

  const title =
    scope === 'clinique' ? 'Rendez-vous clinique' : 'Rendez-vous cabinet';

  usePageHeader({ title, subtitle: 'Agenda médical' });

  const [items, setItems]       = useState<RendezVous[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dateHeure, setDateHeure] = useState('');
  const [motif, setMotif]         = useState('');
  const [typeRdv, setTypeRdv]     = useState('CONSULTATION');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      let url: string;
      if (scope === 'cabinet') {
        url = RDV.BY_MEDECIN_CABINET(userId);
      } else if (hasMedecinClinique(cliniqueId)) {
        url = RDV.BY_MEDECIN_CLINIQUE(userId, cliniqueId!);
      } else {
        url = RDV.BY_MEDECIN(userId);
      }
      const data = await apiGet<RendezVous[]>(url);
      setItems((data ?? []).sort(
        (a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime(),
      ));
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, cliniqueId, scope]);

  useEffect(() => { void load(); }, [load]);

  // Recherche patients pour le formulaire
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    let cancelled = false;
    const loadPatients = async () => {
      try {
        let res: Patient[] = [];
        if (scope === 'cabinet' && userId) {
          res = await apiGet<Patient[]>(MEDECINS.PATIENTS_LIST(userId));
        } else if (hasMedecinClinique(cliniqueId)) {
          res = await apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId!));
        }
        if (!cancelled) {
          const kw = patientSearch.toLowerCase();
          setPatients(
            (res ?? []).filter(
              (p) => p.nom.toLowerCase().includes(kw) || p.prenom.toLowerCase().includes(kw),
            ).slice(0, 8),
          );
        }
      } catch {
        if (!cancelled) setPatients([]);
      }
    };
    void loadPatients();
    return () => { cancelled = true; };
  }, [patientSearch, cliniqueId, scope, userId]);

  /* legacy clinique-only search removed */
  useEffect(() => {
    if (true) return;
    if (!cliniqueId || patientSearch.length < 2) { setPatients([]); return; }
    let cancelled = false;
    apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId)).then((res) => {
      if (!cancelled) {
        const kw = patientSearch.toLowerCase();
        setPatients(
          (res ?? []).filter(
            (p) => p.nom.toLowerCase().includes(kw) || p.prenom.toLowerCase().includes(kw),
          ).slice(0, 8),
        );
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [patientSearch, cliniqueId]);

  async function handleConfirmer(id: string | number) {
    try {
      await apiPatch(RDV.CONFIRMER_MEDECIN(id), {});
      void load(true);
    } catch { /* ignore */ }
  }

  async function handleAnnuler(id: string | number) {
    try {
      await apiPatch(RDV.ANNULER(id), {});
      void load(true);
    } catch { /* ignore */ }
  }

  async function handleCreate() {
    if (!selectedPatient || !dateHeure || !userId) return;
    setSubmitting(true);
    try {
      await apiPost(RDV.CREATE, {
        medecinId: userId,
        patientId: selectedPatient.id,
        dateHeure,
        motif,
        typeRdv,
      });
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

  // ── Rendu carte RDV ──────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: RendezVous }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>
          {item.patientPrenom} {item.patientNom}
        </Text>
        <View style={[styles.badge, { backgroundColor: STATUT_COLOR[item.statut] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUT_COLOR[item.statut] }]}>
            {STATUT_LABEL[item.statut]}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>
        <Ionicons name="time-outline" size={13} color={LUNA_COLORS.tertiary} />{' '}
        {formatDT(item.dateHeure)}
      </Text>
      <Text style={styles.motifText}>{item.motif || 'Sans motif'}</Text>
      <Text style={styles.typeText}>{item.typeRdv}</Text>

      {item.statut === 'PLANIFIE' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3B82F620' }]}
            onPress={() => handleConfirmer(item.id)}
          >
            <Text style={[styles.actionTxt, { color: '#3B82F6' }]}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => handleAnnuler(item.id)}
          >
            <Text style={[styles.actionTxt, { color: '#EF4444' }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color={LUNA_COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(true); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={52} color={LUNA_COLORS.tertiary} />
            <Text style={styles.emptyText}>Aucun rendez-vous</Text>
          </View>
        }
      />

      {/* Modal création RDV */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau rendez-vous</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={LUNA_COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Recherche patient */}
              <Text style={styles.label}>Patient *</Text>
              <TextInput
                style={styles.input}
                placeholder="Rechercher un patient..."
                placeholderTextColor={LUNA_COLORS.tertiary}
                value={selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : patientSearch}
                onChangeText={(t) => { setPatientSearch(t); setSelectedPatient(null); }}
              />
              {patients.length > 0 && !selectedPatient && (
                <View style={styles.suggestions}>
                  {patients.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.suggestion}
                      onPress={() => { setSelectedPatient(p); setPatients([]); }}
                    >
                      <Text style={styles.suggestionText}>{p.prenom} {p.nom}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Date et heure * (YYYY-MM-DDTHH:mm)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-05-15T09:00"
                placeholderTextColor={LUNA_COLORS.tertiary}
                value={dateHeure}
                onChangeText={setDateHeure}
              />

              <Text style={styles.label}>Motif</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Motif du rendez-vous..."
                placeholderTextColor={LUNA_COLORS.tertiary}
                value={motif}
                onChangeText={setMotif}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Type</Text>
              {(['CONSULTATION', 'SUIVI', 'URGENCE', 'TELECONSULTATION'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, typeRdv === t && styles.chipSelected]}
                  onPress={() => setTypeRdv(t)}
                >
                  <Text style={[styles.chipText, typeRdv === t && styles.chipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.submitBtn, (!selectedPatient || !dateHeure || submitting) && styles.submitBtnDisabled]}
                onPress={handleCreate}
                disabled={!selectedPatient || !dateHeure || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>Créer le rendez-vous</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
  },
  title:  { color: LUNA_COLORS.dark, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  addBtn: { padding: spacing.xs },
  list:   { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  patientName:{ color: LUNA_COLORS.dark, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  dateText: { color: LUNA_COLORS.tertiary, fontSize: fontSize.sm, marginBottom: 2 },
  motifText: { color: LUNA_COLORS.dark, fontSize: fontSize.sm, marginBottom: 2 },
  typeText: { color: LUNA_COLORS.secondary, fontSize: fontSize.xs },
  actions:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn:{ flex: 1, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, alignItems: 'center' },
  actionTxt:{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  errorBanner:{ backgroundColor: '#EF444420', padding: spacing.sm, marginHorizontal: spacing.md },
  errorText:  { color: '#EF4444', fontSize: fontSize.sm, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  emptyText: { color: LUNA_COLORS.tertiary, fontSize: fontSize.md },
  // Modal
  overlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modal: { backgroundColor: LUNA_COLORS.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.background,
  },
  modalTitle: { color: LUNA_COLORS.dark, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  modalBody:  { padding: spacing.lg },
  label:      { color: LUNA_COLORS.tertiary, fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.md,
    padding: spacing.md, color: LUNA_COLORS.dark, fontSize: fontSize.sm,
    borderWidth: 1, borderColor: LUNA_COLORS.surface,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  suggestions: { backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.sm, marginTop: 2 },
  suggestion:  { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.surface },
  suggestionText: { color: LUNA_COLORS.dark, fontSize: fontSize.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, backgroundColor: LUNA_COLORS.background,
    marginBottom: spacing.xs, borderWidth: 1, borderColor: LUNA_COLORS.surface,
  },
  chipSelected:     { backgroundColor: LUNA_COLORS.secondary + '22', borderColor: LUNA_COLORS.secondary },
  chipText:         { color: LUNA_COLORS.tertiary, fontSize: fontSize.sm },
  chipTextSelected: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  submitBtn: {
    backgroundColor: LUNA_COLORS.secondary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
});
