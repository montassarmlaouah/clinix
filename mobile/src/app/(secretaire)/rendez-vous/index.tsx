import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, EmptyState, LoadingOverlay } from '@/src/components/common';
import type { BadgeColor } from '@/src/components/common';
import type { Medecin, RdvStatut, RendezVous } from '@/src/api/services/rdv.service';
import { rdvService } from '@/src/api/services/rdv.service';
import { apiGet } from '@/src/api/client';
import { PATIENTS } from '@/src/api/endpoints';
import { type Patient } from '@/src/api/services/patient.service';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayLabel(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
}

function extractTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function groupByHour(list: RendezVous[]): SectionListData<RendezVous>[] {
  const map = new Map<string, RendezVous[]>();
  [...list]
    .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
    .forEach((rdv) => {
      const d    = new Date(rdv.dateHeure);
      const hour = `${String(d.getHours()).padStart(2, '0')}:00`;
      if (!map.has(hour)) map.set(hour, []);
      map.get(hour)!.push(rdv);
    });
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const STATUT_CONFIG: Record<RdvStatut, { label: string; color: BadgeColor }> = {
  PLANIFIE: { label: 'Planifié',  color: 'warning' },
  CONFIRME: { label: 'Confirmé',  color: 'success' },
  ARRIVE:   { label: 'Arrivé',    color: 'info'    },
  ANNULE:   { label: 'Annulé',    color: 'error'   },
  TERMINE:  { label: 'Terminé',   color: 'secondary' },
};

// ── Modale Reporter ───────────────────────────────────────────────────────────
interface ReporterModalProps {
  visible:   boolean;
  loading:   boolean;
  onClose:   () => void;
  onConfirm: (newDate: string) => void;
}

function ReporterModal({ visible, loading, onClose, onConfirm }: ReporterModalProps) {
  const [value, setValue] = useState('');

  function handleClose() {
    setValue('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Nouvelle date & heure</Text>
          <Text style={modalStyles.hint}>Format attendu : YYYY-MM-DD HH:mm</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Ex : 2026-05-10 09:30"
            placeholderTextColor={LUNA_COLORS.textDisabled}
            keyboardType="default"
            style={modalStyles.input}
          />
          <View style={modalStyles.btnRow}>
            <Pressable onPress={handleClose} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelTxt}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={() => value.trim() && onConfirm(value.trim())}
              disabled={loading || !value.trim()}
              style={[modalStyles.confirmBtn, (!value.trim() || loading) && modalStyles.disabled]}
            >
              {loading
                ? <ActivityIndicator color={LUNA_COLORS.textInverse} size="small" />
                : <Text style={modalStyles.confirmTxt}>Confirmer</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Modale RDV Urgent ─────────────────────────────────────────────────────────
interface UrgentModalProps {
  visible:    boolean;
  cliniqueId: string | number | null;
  onClose:    () => void;
  onCreated:  () => void;
}

function UrgentModal({ visible, cliniqueId, onClose, onCreated }: UrgentModalProps) {
  const [medecins,       setMedecins]       = useState<Medecin[]>([]);
  const [allPatients,    setAllPatients]    = useState<Patient[]>([]);
  const [patients,       setPatients]       = useState<Patient[]>([]);
  const [selMedecin,     setSelMedecin]     = useState<Medecin | null>(null);
  const [selPatient,     setSelPatient]     = useState<Patient | null>(null);
  const [patientQuery,   setPatientQuery]   = useState('');
  const [motif,          setMotif]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [loadingMed,     setLoadingMed]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible || !cliniqueId) return;
    setLoadingMed(true);
    rdvService.getMedecinsByClinique(cliniqueId).then(setMedecins).catch(() => {}).finally(() => setLoadingMed(false));
    apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId))
      .then((data) => setAllPatients(data ?? []))
      .catch(() => setAllPatients([]));
  }, [visible, cliniqueId]);

  function searchPatients(q: string) {
    setPatientQuery(q);
    setSelPatient(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setPatients([]); return; }
    debounceRef.current = setTimeout(() => {
      const lower = q.trim().toLowerCase();
      const filtered = allPatients.filter((p) =>
        p.nom.toLowerCase().includes(lower) || p.prenom.toLowerCase().includes(lower)
      );
      setPatients(filtered);
    }, 400);
  }

  function handleClose() {
    setSelMedecin(null);
    setSelPatient(null);
    setPatientQuery('');
    setPatients([]);
    setMotif('');
    onClose();
  }

  async function handleSubmit() {
    if (!selMedecin || !selPatient || !motif.trim()) {
      Alert.alert('Champs manquants', 'Veuillez renseigner tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await rdvService.createRdvUrgent({
        medecinId: selMedecin.id,
        patientId: selPatient.id,
        motif:     motif.trim(),
      });
      handleClose();
      onCreated();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le RDV urgent.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, modalStyles.urgentCard]}>
          {/* En-tête */}
          <View style={urgentStyles.header}>
            <Ionicons name="warning" size={22} color={LUNA_COLORS.error} />
            <Text style={urgentStyles.title}>Rendez-vous Urgent</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={LUNA_COLORS.textSecondary} />
            </Pressable>
          </View>

          {/* Patient */}
          <Text style={urgentStyles.label}>Patient</Text>
          {selPatient ? (
            <Pressable onPress={() => setSelPatient(null)} style={urgentStyles.selectedChip}>
              <Text style={urgentStyles.selectedChipText}>
                {selPatient.prenom} {selPatient.nom}
              </Text>
              <Ionicons name="close-circle" size={16} color={LUNA_COLORS.secondary} />
            </Pressable>
          ) : (
            <>
              <TextInput
                value={patientQuery}
                onChangeText={searchPatients}
                placeholder="Rechercher un patient…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                style={urgentStyles.input}
              />
              {patients.length > 0 && (
                <FlatList
                  data={patients.slice(0, 4)}
                  keyExtractor={(p) => String(p.id)}
                  style={urgentStyles.dropDown}
                  renderItem={({ item }) => (
                    <Pressable
                      style={urgentStyles.dropItem}
                      onPress={() => { setSelPatient(item); setPatients([]); }}
                    >
                      <Text style={urgentStyles.dropItemText}>
                        {item.prenom} {item.nom} — {item.telephone}
                      </Text>
                    </Pressable>
                  )}
                />
              )}
            </>
          )}

          {/* Médecin */}
          <Text style={[urgentStyles.label, { marginTop: spacing.md }]}>Médecin</Text>
          {loadingMed ? (
            <ActivityIndicator color={LUNA_COLORS.secondary} />
          ) : (
            <FlatList
              data={medecins}
              horizontal
              keyExtractor={(m) => String(m.id)}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.sm }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelMedecin(item)}
                  style={[
                    urgentStyles.medChip,
                    selMedecin?.id === item.id && urgentStyles.medChipActive,
                  ]}
                >
                  <Text style={[
                    urgentStyles.medChipText,
                    selMedecin?.id === item.id && urgentStyles.medChipTextActive,
                  ]}>
                    Dr {item.nom}
                  </Text>
                </Pressable>
              )}
            />
          )}

          {/* Motif */}
          <Text style={urgentStyles.label}>Motif</Text>
          <TextInput
            value={motif}
            onChangeText={setMotif}
            placeholder="Motif de l'urgence…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
            multiline
            numberOfLines={2}
            style={[urgentStyles.input, { minHeight: 56 }]}
          />

          {/* Bouton */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[urgentStyles.submitBtn, loading && modalStyles.disabled]}
          >
            {loading
              ? <ActivityIndicator color={LUNA_COLORS.textInverse} size="small" />
              : (
                <>
                  <Ionicons name="warning-outline" size={18} color={LUNA_COLORS.textInverse} />
                  <Text style={urgentStyles.submitText}>Créer le RDV urgent</Text>
                </>
              )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Écran principal — Agenda ──────────────────────────────────────────────────
export default function AgendaScreen(): React.JSX.Element {
  const userId     = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  usePageHeader({ title: 'Agenda', subtitle: todayLabel() });

  const [rdvs,          setRdvs]          = useState<RendezVous[]>([]);
  const [loading,       setLoading]        = useState(true);
  const [refreshing,    setRefreshing]     = useState(false);
  const [actionId,      setActionId]       = useState<string | number | null>(null);
  const [reportTarget,  setReportTarget]   = useState<string | number | null>(null);
  const [reportLoading, setReportLoading]  = useState(false);
  const [urgentVisible, setUrgentVisible]  = useState(false);

  const loadRdv = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      const data = await rdvService.getRdvClinique(cliniqueId);
      setRdvs(data);
    } catch {
      // Conserver les données précédentes en cas d'erreur réseau
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { loadRdv(); }, [loadRdv]);

  const handleRefresh = () => { setRefreshing(true); loadRdv(); };

  // ── Confirmer ──────────────────────────────────────────────────────────────
  async function handleConfirmer(id: string | number) {
    setActionId(id);
    try {
      await rdvService.confirmerRdv(id);
      setRdvs((prev) => prev.map((r) => r.id === id ? { ...r, statut: 'CONFIRME' } : r));
    } catch {
      Alert.alert('Erreur', 'Impossible de confirmer ce rendez-vous.');
    } finally {
      setActionId(null);
    }
  }

  // ── Annuler ────────────────────────────────────────────────────────────────
  function handleAnnuler(id: string | number) {
    Alert.alert(
      'Annuler le rendez-vous',
      'Cette action est irréversible.',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text:  'Confirmer l\'annulation',
          style: 'destructive',
          onPress: async () => {
            setActionId(id);
            try {
              await rdvService.annulerRdv(id);
              setRdvs((prev) => prev.map((r) => r.id === id ? { ...r, statut: 'ANNULE' } : r));
            } catch {
              Alert.alert('Erreur', 'Impossible d\'annuler ce rendez-vous.');
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  }

  // ── Reporter ───────────────────────────────────────────────────────────────
  async function handleReporter(newDateStr: string) {
    if (!reportTarget) return;
    // "YYYY-MM-DD HH:mm" → "YYYY-MM-DDTHH:mm:00"
    const iso = newDateStr.replace(' ', 'T') + ':00';
    setReportLoading(true);
    try {
      await rdvService.reporterRdv(reportTarget, iso);
      setRdvs((prev) =>
        prev.map((r) =>
          r.id === reportTarget ? { ...r, statut: 'PLANIFIE', dateHeure: iso } : r
        )
      );
      setReportTarget(null);
    } catch {
      Alert.alert('Erreur', 'Impossible de reporter ce rendez-vous.');
    } finally {
      setReportLoading(false);
    }
  }

  // ── Rendu carte RDV ────────────────────────────────────────────────────────
  function renderRdvCard({ item }: { item: RendezVous }) {
    const cfg       = STATUT_CONFIG[item.statut] ?? { label: item.statut, color: 'default' as BadgeColor };
    const isLoading = actionId === item.id;

    return (
      <Card style={styles.rdvCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.heure}>{extractTime(item.dateHeure)}</Text>
          <Badge label={cfg.label} color={cfg.color} />
        </View>

        <Text style={styles.patientName}>
          {item.patientPrenom} {item.patientNom}
        </Text>

        {item.motif ? (
          <Text style={styles.motif} numberOfLines={2}>{item.motif}</Text>
        ) : null}

        <Text style={styles.medecinName}>
          Dr {item.medecinPrenom} {item.medecinNom} · {item.medecinSpecialite}
        </Text>

        {/* Boutons d'action uniquement sur les RDV planifiés */}
        {item.statut === 'PLANIFIE' ? (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleConfirmer(item.id)}
              disabled={isLoading}
              style={[styles.actionBtn, styles.confirmerBtn]}
            >
              {isLoading
                ? <ActivityIndicator color={LUNA_COLORS.textInverse} size="small" />
                : <Text style={styles.actionBtnTxt}>Confirmer</Text>}
            </Pressable>

            <Pressable
              onPress={() => setReportTarget(item.id)}
              disabled={isLoading}
              style={[styles.actionBtn, styles.reporterBtn]}
            >
              <Text style={styles.actionBtnTxt}>Reporter</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAnnuler(item.id)}
              disabled={isLoading}
              style={[styles.actionBtn, styles.annulerBtn]}
            >
              <Text style={styles.actionBtnTxt}>Annuler</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>
    );
  }

  function renderSectionHeader({ section }: { section: SectionListData<RendezVous> }) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionLine} />
      </View>
    );
  }

  if (loading) return <LoadingOverlay />;

  const sections = groupByHour(rdvs);

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerDate}>{todayLabel()}</Text>
          <Text style={styles.headerCount}>
            {rdvs.length} rendez-vous
          </Text>
        </View>
      </View>

      {/* Liste */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRdvCard}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Aucun rendez-vous"
            subtitle="Aucun rendez-vous programmé pour aujourd'hui."
          />
        }
      />

      {/* FAB — Urgent */}
      <Pressable
        style={styles.fab}
        onPress={() => setUrgentVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Créer un rendez-vous urgent"
      >
        <Ionicons name="warning" size={18} color={LUNA_COLORS.textInverse} />
        <Text style={styles.fabTxt}>URGENT +</Text>
      </Pressable>

      {/* Modale Reporter */}
      <ReporterModal
        visible={reportTarget !== null}
        loading={reportLoading}
        onClose={() => setReportTarget(null)}
        onConfirm={handleReporter}
      />

      {/* Modale Urgent */}
      <UrgentModal
        visible={urgentVisible}
        cliniqueId={cliniqueId}
        onClose={() => setUrgentVisible(false)}
        onCreated={() => { setUrgentVisible(false); loadRdv(); }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: LUNA_COLORS.background,
  },
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor: LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  headerDate: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.darkest,
    textTransform: 'capitalize',
  },
  headerCount: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop:        spacing.md,
    paddingBottom:     100,
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    marginTop:      spacing.lg,
    marginBottom:   spacing.sm,
    gap:            spacing.sm,
  },
  sectionTitle: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.secondary,
  },
  sectionLine: {
    flex:            1,
    height:          1,
    backgroundColor: LUNA_COLORS.borderDark,
  },
  rdvCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing.xs,
  },
  heure: {
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.secondary,
  },
  patientName: {
    fontSize:     fontSize.lg,
    fontWeight:   fontWeight.semibold,
    color:        LUNA_COLORS.darkest,
    marginBottom: spacing.xs,
  },
  motif: {
    fontSize:     fontSize.sm,
    color:        LUNA_COLORS.textSecondary,
    marginBottom: spacing.xs,
  },
  medecinName: {
    fontSize: fontSize.xs,
    color:    LUNA_COLORS.tertiary,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop:     spacing.md,
    gap:           spacing.sm,
  },
  actionBtn: {
    flex:            1,
    paddingVertical: spacing.sm,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    borderRadius.sm,
    minHeight:       36,
  },
  confirmerBtn: { backgroundColor: LUNA_COLORS.success  },
  reporterBtn:  { backgroundColor: LUNA_COLORS.warning  },
  annulerBtn:   { backgroundColor: LUNA_COLORS.error    },
  actionBtnTxt: {
    color:      LUNA_COLORS.textInverse,
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  fab: {
    position:        'absolute',
    bottom:          spacing.xxl,
    right:           spacing.xxl,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.xs,
    backgroundColor: LUNA_COLORS.error,
    borderRadius:    borderRadius.xxl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.lg,
    ...(shadows.lg as object),
  },
  fabTxt: {
    color:      LUNA_COLORS.textInverse,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});

// ── Styles modales partagés ───────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex:              1,
    backgroundColor:   LUNA_COLORS.overlay,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: spacing.xxl,
  },
  card: {
    width:           '100%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.xxl,
  },
  urgentCard: {
    maxHeight: '85%',
  },
  btnRow: {
    flexDirection: 'row',
    gap:           spacing.md,
    marginTop:     spacing.lg,
  },
  cancelBtn: {
    flex:            1,
    paddingVertical: spacing.md,
    alignItems:      'center',
    borderRadius:    borderRadius.md,
    borderWidth:     1.5,
    borderColor:     LUNA_COLORS.borderDark,
  },
  cancelTxt: {
    color:      LUNA_COLORS.textSecondary,
    fontWeight: fontWeight.medium,
  },
  confirmBtn: {
    flex:            1,
    paddingVertical: spacing.md,
    alignItems:      'center',
    borderRadius:    borderRadius.md,
    backgroundColor: LUNA_COLORS.warning,
  },
  confirmTxt: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
  },
  disabled: {
    opacity: 0.45,
  },
  title: {
    fontSize:     fontSize.lg,
    fontWeight:   fontWeight.semibold,
    color:        LUNA_COLORS.dark,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize:     fontSize.xs,
    color:        LUNA_COLORS.textSecondary,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth:       1.5,
    borderColor:       LUNA_COLORS.borderDark,
    borderRadius:      borderRadius.md,
    padding:           spacing.md,
    fontSize:          fontSize.base,
    color:             LUNA_COLORS.textPrimary,
    backgroundColor:   LUNA_COLORS.surface,
    marginBottom:      spacing.lg,
    includeFontPadding: false,
  },
});

// ── Styles modale urgente ─────────────────────────────────────────────────────
const urgentStyles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    marginBottom:   spacing.lg,
  },
  title: {
    flex:       1,
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
  },
  label: {
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.medium,
    color:        LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth:       1.5,
    borderColor:       LUNA_COLORS.borderDark,
    borderRadius:      borderRadius.md,
    padding:           spacing.md,
    fontSize:          fontSize.base,
    color:             LUNA_COLORS.textPrimary,
    backgroundColor:   LUNA_COLORS.surface,
    marginBottom:      spacing.sm,
    includeFontPadding: false,
  },
  dropDown: {
    maxHeight:       140,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.border,
    borderRadius:    borderRadius.md,
    backgroundColor: LUNA_COLORS.surface,
    marginBottom:    spacing.sm,
  },
  dropItem: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: LUNA_COLORS.border,
  },
  dropItemText: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textPrimary,
  },
  selectedChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.xs,
    backgroundColor:   LUNA_COLORS.infoLight,
    borderRadius:      borderRadius.full,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf:         'flex-start',
    marginBottom:      spacing.sm,
  },
  selectedChipText: {
    fontSize:   fontSize.sm,
    color:      LUNA_COLORS.secondary,
    fontWeight: fontWeight.medium,
  },
  medChip: {
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius:      borderRadius.full,
    backgroundColor:   LUNA_COLORS.surfaceLight,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
    marginRight:       spacing.sm,
  },
  medChipActive: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor:     LUNA_COLORS.secondary,
  },
  medChipText: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textPrimary,
  },
  medChipTextActive: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
  },
  submitBtn: {
    flexDirection:   'row',
    gap:             spacing.sm,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: LUNA_COLORS.error,
    borderRadius:    borderRadius.md,
    paddingVertical: spacing.md,
    marginTop:       spacing.lg,
  },
  submitText: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
    fontSize:   fontSize.base,
  },
});
