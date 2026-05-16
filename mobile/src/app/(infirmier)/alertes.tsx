import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { ALERTES, PATIENTS, MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'medecin' | 'materiel';
type Niveau = 1 | 2 | 3;

interface AlerteItem {
  type: 'TACHE_EN_RETARD' | 'ADMIN_MANQUEE' | 'URGENCE_ACTIVE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detail: string;
  patientNom: string;
  patientId: string | null;
  referenceId: string;
}

interface DashboardResponse {
  totalAlertes: number;
  tachesEnRetard: number;
  adminManquees: number;
  urgencesActives: number;
  alertes: AlerteItem[];
}

const ALERTE_TYPE_CONFIG: Record<AlerteItem['type'], { icon: string; color: string; bg: string }> = {
  TACHE_EN_RETARD: { icon: 'time-outline',        color: LUNA_COLORS.error,   bg: LUNA_COLORS.errorLight   },
  ADMIN_MANQUEE:   { icon: 'medical-outline',     color: LUNA_COLORS.warning, bg: LUNA_COLORS.warningLight },
  URGENCE_ACTIVE:  { icon: 'alert-circle-outline', color: LUNA_COLORS.error,  bg: LUNA_COLORS.errorLight   },
};

interface PatientResult {
  id:     number;
  nom:    string;
  prenom: string;
}

const NIVEAU_CONFIG: Record<Niveau, { label: string; color: string; bg: string; icon: string }> = {
  1: { label: 'Niveau 1 — Info',    color: LUNA_COLORS.info,    bg: LUNA_COLORS.infoLight,    icon: 'information-circle-outline' },
  2: { label: 'Niveau 2 — Moyen',   color: LUNA_COLORS.warning, bg: LUNA_COLORS.warningLight, icon: 'warning-outline'             },
  3: { label: 'Niveau 3 — Urgent',  color: LUNA_COLORS.error,   bg: LUNA_COLORS.errorLight,   icon: 'alert-circle-outline'        },
};

// ── Composant animation succès ─────────────────────────────────────────────────
function SuccessCheck({ anim }: { anim: Animated.Value }): React.JSX.Element {
  const scale   = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.2, 1] });
  const opacity = anim;
  return (
    <Animated.View style={[styles.successWrap, { transform: [{ scale }], opacity }]}>
      <Ionicons name="checkmark-circle" size={48} color={LUNA_COLORS.success} />
      <Text style={styles.successTxt}>Alerte envoyée</Text>
    </Animated.View>
  );
}

// ── Écran Alertes ─────────────────────────────────────────────────────────────
export default function AlertesScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => String(s.userId ?? ""));
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [tab, setTab] = useState<Tab>('medecin');

  // ── Formulaire Médecin ────────────────────────────────────────────────────────
  const [patientSearch,   setPatientSearch]   = useState('');
  const [patientResults,  setPatientResults]  = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [niveau,          setNiveau]          = useState<Niveau>(2);
  const [descMedecin,     setDescMedecin]     = useState('');
  const [submittingMed,   setSubmittingMed]   = useState(false);
  const [errorMed,        setErrorMed]        = useState('');
  const successMedAnim = useRef(new Animated.Value(0)).current;
  const searchTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Formulaire Matériel ───────────────────────────────────────────────────────
  const [descMateriel,   setDescMateriel]   = useState('');
  const [service,        setService]        = useState('');
  const [submittingMat,  setSubmittingMat]  = useState(false);
  const [errorMat,       setErrorMat]       = useState('');
  const successMatAnim = useRef(new Animated.Value(0)).current;

  // ── Patients (chargés une fois pour la recherche locale) ──────────────────
  const [allPatients, setAllPatients] = useState<PatientResult[]>([]);
  // Charger les patients une fois au montage
  useEffect(() => {
    if (!cliniqueId) return;
    apiGet<PatientResult[]>(PATIENTS.BY_CLINIQUE(cliniqueId))
      .then((data) => setAllPatients(data ?? []))
      .catch(() => setAllPatients([]));
  }, [cliniqueId]);

  const handlePatientSearch = useCallback((text: string) => {
    setPatientSearch(text);
    setSelectedPatient(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setPatientResults([]); return; }
    searchTimer.current = setTimeout(() => {
      setSearchLoading(true);
      const lower = text.trim().toLowerCase();
      const filtered = allPatients.filter((p) =>
        p.nom.toLowerCase().includes(lower) || p.prenom.toLowerCase().includes(lower)
      );
      setPatientResults(filtered.slice(0, 6));
      setSearchLoading(false);
    }, 400);
  }, [allPatients]);

  function selectPatient(p: PatientResult) {
    setSelectedPatient(p);
    setPatientSearch(`${p.prenom} ${p.nom}`);
    setPatientResults([]);
  }

  // ── Animation succès ─────────────────────────────────────────────────────────
  function playSuccess(anim: Animated.Value, reset: () => void) {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }).start();
    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      reset();
    }, 2000);
  }

  // ── Soumettre alerte médecin ─────────────────────────────────────────────────
  async function handleSubmitMedecin() {
    if (!selectedPatient) { setErrorMed('Sélectionnez un patient.'); return; }
    if (!descMedecin.trim()) { setErrorMed('Décrivez la situation.'); return; }
    setSubmittingMed(true);
    setErrorMed('');
    try {
      await apiPost(ALERTES.URGENCE, {
        patientId:   selectedPatient.id,
        infirmierId: userId,
        description: descMedecin.trim(),
        niveau,
        cliniqueId:  cliniqueId ?? undefined,
      });
      playSuccess(successMedAnim, () => {
        setSelectedPatient(null);
        setPatientSearch('');
        setDescMedecin('');
        setNiveau(2);
      });
    } catch {
      setErrorMed('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setSubmittingMed(false);
    }
  }

  // ── Soumettre alerte matériel ────────────────────────────────────────────────
  async function handleSubmitMateriel() {
    if (!descMateriel.trim()) { setErrorMat('Décrivez le manque de matériel.'); return; }
    if (!service.trim())      { setErrorMat('Indiquez le service concerné.'); return; }
    setSubmittingMat(true);
    setErrorMat('');
    try {
      await apiPost(ALERTES.MATERIEL, {
        description: descMateriel.trim(),
        service:     service.trim(),
        cliniqueId:  cliniqueId ?? undefined,
      });
      playSuccess(successMatAnim, () => {
        setDescMateriel('');
        setService('');
      });
    } catch {
      setErrorMat('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setSubmittingMat(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alertes</Text>
      </View>

      {/* Chips onglets */}
      <View style={styles.chips}>
        {(['medecin', 'materiel'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.chip, tab === t && styles.chipActive]}
          >
            <Ionicons
              name={t === 'medecin' ? 'medkit-outline' : 'construct-outline'}
              size={14}
              color={tab === t ? LUNA_COLORS.textInverse : LUNA_COLORS.tertiary}
            />
            <Text style={[styles.chipTxt, tab === t && styles.chipTxtActive]}>
              {t === 'medecin' ? 'Alerter médecin' : 'Matériel'}
            </Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Formulaire Médecin ──────────────────────────────────────────── */}
          {tab === 'medecin' && (
            <View>
              {/* Recherche patient */}
              <Text style={styles.fieldLabel}>Patient concerné *</Text>
              <View style={[styles.inputWrap, !!selectedPatient && styles.inputSelected]}>
                <Ionicons
                  name={selectedPatient ? 'person' : 'search-outline'}
                  size={16}
                  color={selectedPatient ? LUNA_COLORS.secondary : LUNA_COLORS.textSecondary}
                />
                <TextInput
                  value={patientSearch}
                  onChangeText={handlePatientSearch}
                  placeholder="Rechercher un patient…"
                  placeholderTextColor={LUNA_COLORS.textDisabled}
                  style={styles.input}
                />
                {selectedPatient && (
                  <Pressable onPress={() => { setSelectedPatient(null); setPatientSearch(''); }}>
                    <Ionicons name="close-circle" size={18} color={LUNA_COLORS.error} />
                  </Pressable>
                )}
              </View>

              {/* Résultats recherche */}
              {patientResults.length > 0 && (
                <View style={styles.searchResults}>
                  <FlatList
                    data={patientResults}
                    keyExtractor={(p) => String(p.id)}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Pressable onPress={() => selectPatient(item)} style={styles.searchResult}>
                        <Ionicons name="person-outline" size={14} color={LUNA_COLORS.tertiary} />
                        <Text style={styles.searchResultTxt}>{item.prenom} {item.nom}</Text>
                      </Pressable>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.resultSep} />}
                  />
                </View>
              )}

              {/* Chips niveau */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Niveau d'urgence *</Text>
              <View style={styles.niveauChips}>
                {([1, 2, 3] as Niveau[]).map((n) => {
                  const cfg    = NIVEAU_CONFIG[n];
                  const active = niveau === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setNiveau(n)}
                      style={[
                        styles.niveauChip,
                        { borderColor: cfg.color },
                        active && { backgroundColor: cfg.bg },
                      ]}
                    >
                      <Ionicons
                        name={cfg.icon as never}
                        size={14}
                        color={active ? cfg.color : LUNA_COLORS.textSecondary}
                      />
                      <Text style={[styles.niveauTxt, active && { color: cfg.color, fontWeight: fontWeight.bold }]}>
                        N{n}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.niveauDesc}>{NIVEAU_CONFIG[niveau].label}</Text>

              {/* Description */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Description *</Text>
              <TextInput
                value={descMedecin}
                onChangeText={(v) => { setDescMedecin(v); setErrorMed(''); }}
                placeholder="Décrivez la situation d'urgence, les symptômes observés…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                style={[styles.textarea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {errorMed ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={14} color={LUNA_COLORS.error} />
                  <Text style={styles.errorTxt}>{errorMed}</Text>
                </View>
              ) : null}

              {/* Animation succès */}
              <SuccessCheck anim={successMedAnim} />

              <Pressable
                onPress={handleSubmitMedecin}
                disabled={submittingMed}
                style={[styles.submitBtn, styles.submitDanger, submittingMed && styles.btnDisabled]}
              >
                <Ionicons name="alert-circle" size={18} color={LUNA_COLORS.textInverse} />
                <Text style={styles.submitTxt}>
                  {submittingMed ? 'Envoi…' : 'Envoyer l\'alerte'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* ── Formulaire Matériel ─────────────────────────────────────────── */}
          {tab === 'materiel' && (
            <View>
              <Text style={styles.fieldLabel}>Matériel manquant *</Text>
              <TextInput
                value={descMateriel}
                onChangeText={(v) => { setDescMateriel(v); setErrorMat(''); }}
                placeholder="Ex : Seringues 10ml, gants stériles taille M…"
                placeholderTextColor={LUNA_COLORS.textDisabled}
                style={[styles.textarea]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Service concerné *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="business-outline" size={16} color={LUNA_COLORS.textSecondary} />
                <TextInput
                  value={service}
                  onChangeText={(v) => { setService(v); setErrorMat(''); }}
                  placeholder="Ex : Urgences, Chirurgie, Cardiologie…"
                  placeholderTextColor={LUNA_COLORS.textDisabled}
                  style={styles.input}
                />
              </View>

              {errorMat ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={14} color={LUNA_COLORS.error} />
                  <Text style={styles.errorTxt}>{errorMat}</Text>
                </View>
              ) : null}

              {/* Animation succès */}
              <SuccessCheck anim={successMatAnim} />

              <Pressable
                onPress={handleSubmitMateriel}
                disabled={submittingMat}
                style={[styles.submitBtn, styles.submitWarning, submittingMat && styles.btnDisabled]}
              >
                <Ionicons name="construct-outline" size={18} color={LUNA_COLORS.textInverse} />
                <Text style={styles.submitTxt}>
                  {submittingMat ? 'Envoi…' : 'Signaler le manque'}
                </Text>
              </Pressable>
            </View>
          )}
          {/* ── (dashboard supprimé — endpoint inexistant) ────────────── */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },

  // Chips onglets
  chips: {
    flexDirection:     'row',
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.md,
    gap:               spacing.sm,
    backgroundColor:   LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.border,
  },
  chip: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.xs,
    paddingVertical:   spacing.sm,
    borderRadius:      borderRadius.sm,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
  },
  chipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt:       { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.tertiary },
  chipTxtActive: { color: LUNA_COLORS.textInverse },

  // Formulaire
  formContent: { padding: spacing.xxl, paddingBottom: 60 },
  fieldLabel:  { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginBottom: spacing.sm },

  inputWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.md,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
    paddingHorizontal: spacing.md,
    height:            48,
    ...(shadows.sm as object),
  },
  inputSelected: { borderColor: LUNA_COLORS.secondary },
  input: {
    flex:      1,
    fontSize:  fontSize.base,
    color:     LUNA_COLORS.textPrimary,
  },

  // Résultats recherche
  searchResults: {
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.md,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
    marginTop:         spacing.xs,
    ...(shadows.md as object),
  },
  searchResult: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
  },
  searchResultTxt: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  resultSep:       { height: 0.5, backgroundColor: LUNA_COLORS.border, marginHorizontal: spacing.md },

  // Chips niveau
  niveauChips: { flexDirection: 'row', gap: spacing.sm },
  niveauChip: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.xs,
    paddingVertical:   spacing.sm,
    borderRadius:      borderRadius.sm,
    borderWidth:       1.5,
    backgroundColor:   LUNA_COLORS.surface,
  },
  niveauTxt:  { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.textSecondary },
  niveauDesc: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },

  // Textarea
  textarea: {
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.md,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
    fontSize:          fontSize.base,
    color:             LUNA_COLORS.textPrimary,
    minHeight:         100,
    ...(shadows.sm as object),
  },

  // Erreur
  errorBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.xs,
    marginTop:         spacing.sm,
    backgroundColor:   LUNA_COLORS.errorLight,
    borderRadius:      borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
  },
  errorTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.error, flex: 1 },

  // Succès
  successWrap: {
    alignItems:     'center',
    gap:            spacing.sm,
    paddingVertical: spacing.lg,
  },
  successTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.success },

  // Boutons submit
  submitBtn: {
    height:          52,
    borderRadius:    borderRadius.md,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    marginTop:       spacing.lg,
  },
  submitDanger:  { backgroundColor: LUNA_COLORS.error },
  submitWarning: { backgroundColor: LUNA_COLORS.warning },
  btnDisabled:   { opacity: 0.6 },
  submitTxt:     { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },

  // Dashboard
  badgeDot:     { backgroundColor: LUNA_COLORS.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeDotTxt:  { color: '#fff', fontSize: 9, fontWeight: fontWeight.bold },
  summaryRow:   { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryChip:  { flex: 1, backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md, borderWidth: 1.5, padding: spacing.sm, alignItems: 'center' },
  summaryNum:   { fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  summaryLabel: { fontSize: 10, color: LUNA_COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  alerteCard:   { borderRadius: borderRadius.md, borderLeftWidth: 4, padding: spacing.md, marginBottom: spacing.sm },
  alerteCardRow:{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  alerteTitle:  { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  alerteDetail: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  alertePatient:{ fontSize: 10, color: LUNA_COLORS.textDisabled, marginTop: 4 },
  dashCenter:   { alignItems: 'center', paddingTop: 40, gap: spacing.sm },
  dashLoading:  { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  dashEmpty:    { fontSize: fontSize.base, color: LUNA_COLORS.success, fontWeight: fontWeight.medium },
});
