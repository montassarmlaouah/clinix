import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, LoadingOverlay } from '@/src/components/common';
import type { Medecin } from '@/src/api/services/rdv.service';
import { rdvService } from '@/src/api/services/rdv.service';
import { type Patient } from '@/src/api/services/patient.service';
import { apiGet } from '@/src/api/client';
import { PATIENTS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, iconSize, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

interface WizardData {
  patient:      Patient | null;
  medecin:      Medecin | null;
  selectedDate: string | null;   // YYYY-MM-DD
  selectedSlot: string | null;   // HH:mm
  motif:        string;
  typeRdv:      string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateWeekDays(): { label: string; value: string }[] {
  const result: { label: string; value: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.toISOString().slice(0, 10),
    });
  }
  return result;
}

function generateAllSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

const WEEK_DAYS  = generateWeekDays();
const ALL_SLOTS  = generateAllSlots();
const STEP_COUNT = 4;
const STEP_LABELS: string[] = ['Patient', 'Médecin', 'Date & Heure', 'Confirmation'];

// ── Barre de progression ──────────────────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  return (
    <View style={stepStyles.container}>
      <View style={stepStyles.track}>
        <View style={[stepStyles.fill, { width: `${((step - 1) / (STEP_COUNT - 1)) * 100}%` }]} />
      </View>
      <View style={stepStyles.dotsRow}>
        {STEP_LABELS.map((label, i) => {
          const done    = i + 1 < step;
          const current = i + 1 === step;
          return (
            <View key={label} style={stepStyles.dotWrap}>
              <View style={[
                stepStyles.dot,
                done || current ? stepStyles.dotActive : stepStyles.dotInactive,
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color={LUNA_COLORS.textInverse} />
                  : <Text style={[stepStyles.dotNum, (done || current) && stepStyles.dotNumActive]}>
                      {i + 1}
                    </Text>}
              </View>
              <Text style={[stepStyles.dotLabel, current && stepStyles.dotLabelActive]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Étape 1 — Sélection patient ───────────────────────────────────────────────
function Step1Patient({
  selected,
  onSelect,
  onNewPatient,
}: {
  selected:     Patient | null;
  onSelect:     (p: Patient) => void;
  onNewPatient: () => void;
}) {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!cliniqueId) return;
    apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId))
      .then(setAllPatients)
      .catch(() => {});
  }, [cliniqueId]);

  // Recherche locale (l'endpoint /recherche n'existe pas)
  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = q.trim().toLowerCase();
    if (term.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(() => {
      const filtered = allPatients.filter((p) =>
        (p.nom?.toLowerCase().includes(term) ?? false) ||
        (p.prenom?.toLowerCase().includes(term) ?? false) ||
        (p.telephone?.toLowerCase().includes(term) ?? false)
      );
      setResults(filtered);
      setSearching(false);
    }, 400);
  }, [allPatients]);

  if (selected) {
    return (
      <Card style={step1Styles.selectedCard}>
        <View style={step1Styles.selectedRow}>
          <View style={step1Styles.avatar}>
            <Text style={step1Styles.avatarText}>
              {getInitials(selected.nom, selected.prenom)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={step1Styles.name}>
              {selected.prenom} {selected.nom}
            </Text>
            <Text style={step1Styles.phone}>{selected.telephone}</Text>
          </View>
          <Pressable onPress={() => {}} hitSlop={8}>
            <Ionicons name="checkmark-circle" size={24} color={LUNA_COLORS.success} />
          </Pressable>
        </View>
      </Card>
    );
  }

  return (
    <View>
      <Input
        label="Rechercher un patient"
        value={query}
        onChangeText={search}
        placeholder="Nom, prénom ou téléphone…"
        leftIcon={
          <Ionicons name="search-outline" size={20} color={LUNA_COLORS.textSecondary} />
        }
        rightIcon={
          searching
            ? <ActivityIndicator color={LUNA_COLORS.secondary} size="small" />
            : null
        }
      />

      {results.length > 0 ? (
        <Card style={step1Styles.resultsCard}>
          {results.slice(0, 6).map((p) => (
            <Pressable
              key={p.id}
              style={step1Styles.resultRow}
              onPress={() => onSelect(p)}
            >
              <View style={step1Styles.resultAvatar}>
                <Text style={step1Styles.resultAvatarTxt}>
                  {getInitials(p.nom, p.prenom)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={step1Styles.resultName}>
                  {p.prenom} {p.nom}
                </Text>
                <Text style={step1Styles.resultPhone}>{p.telephone}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Pressable style={step1Styles.newBtn} onPress={onNewPatient}>
        <Ionicons name="person-add-outline" size={18} color={LUNA_COLORS.secondary} />
        <Text style={step1Styles.newBtnTxt}>Nouveau patient</Text>
      </Pressable>
    </View>
  );
}

// ── Étape 2 — Sélection médecin ───────────────────────────────────────────────
function Step2Medecin({
  medecins,
  selected,
  onSelect,
  loading,
}: {
  medecins: Medecin[];
  selected: Medecin | null;
  onSelect: (m: Medecin) => void;
  loading:  boolean;
}) {
  if (loading) return <LoadingOverlay />;

  return (
    <FlatList
      data={medecins}
      keyExtractor={(m) => String(m.id)}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const isSelected = selected?.id === item.id;
        return (
          <Pressable
            onPress={() => onSelect(item)}
            style={[step2Styles.card, isSelected && step2Styles.cardSelected]}
          >
            <View style={[step2Styles.avatar, isSelected && step2Styles.avatarSelected]}>
              <Text style={step2Styles.avatarTxt}>
                {getInitials(item.nom, item.prenom)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[step2Styles.name, isSelected && step2Styles.nameSelected]}>
                Dr {item.prenom} {item.nom}
              </Text>
              <Text style={step2Styles.specialite}>{item.specialite}</Text>
            </View>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={22} color={LUNA_COLORS.secondary} />
            ) : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <Text style={step2Styles.empty}>Aucun médecin disponible.</Text>
      }
    />
  );
}

// ── Étape 3 — Date & Créneau ──────────────────────────────────────────────────
function Step3DateTime({
  selectedDate,
  selectedSlot,
  dispos,
  loadingDispos,
  onDateChange,
  onSlotChange,
}: {
  selectedDate:  string | null;
  selectedSlot:  string | null;
  dispos:        string[];
  loadingDispos: boolean;
  onDateChange:  (d: string) => void;
  onSlotChange:  (s: string) => void;
}) {
  return (
    <View>
      {/* Semaine glissante */}
      <Text style={step3Styles.sectionLabel}>Choisir une date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={step3Styles.weekScroll}>
        {WEEK_DAYS.map((day) => {
          const active = selectedDate === day.value;
          return (
            <Pressable
              key={day.value}
              onPress={() => onDateChange(day.value)}
              style={[step3Styles.dayChip, active && step3Styles.dayChipActive]}
            >
              <Text style={[step3Styles.dayTxt, active && step3Styles.dayTxtActive]}>
                {day.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Grille des créneaux */}
      {selectedDate ? (
        <>
          <Text style={[step3Styles.sectionLabel, { marginTop: spacing.lg }]}>
            Créneaux disponibles
          </Text>
          {loadingDispos ? (
            <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginTop: spacing.lg }} />
          ) : (
            <View style={step3Styles.slotsGrid}>
              {ALL_SLOTS.map((slot) => {
                const available = dispos.includes(slot);
                const active    = selectedSlot === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => available && onSlotChange(slot)}
                    disabled={!available}
                    style={[
                      step3Styles.slotChip,
                      available && step3Styles.slotAvailable,
                      active    && step3Styles.slotActive,
                    ]}
                  >
                    <Text style={[
                      step3Styles.slotTxt,
                      available && step3Styles.slotTxtAvailable,
                      active    && step3Styles.slotTxtActive,
                    ]}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : (
        <Text style={step3Styles.hint}>Sélectionnez une date pour voir les créneaux.</Text>
      )}
    </View>
  );
}

// ── Étape 4 — Confirmation ────────────────────────────────────────────────────
function Step4Confirm({
  data,
  motif,
  onMotifChange,
  onSubmit,
  loading,
}: {
  data:          WizardData;
  motif:         string;
  onMotifChange: (v: string) => void;
  onSubmit:      () => void;
  loading:       boolean;
}) {
  return (
    <View>
      <Card style={step4Styles.recap}>
        <RecapRow icon="person-outline"   label="Patient" value={`${data.patient?.prenom} ${data.patient?.nom}`} />
        <RecapRow icon="medkit-outline"   label="Médecin" value={`Dr ${data.medecin?.prenom} ${data.medecin?.nom} — ${data.medecin?.specialite}`} />
        <RecapRow icon="calendar-outline" label="Date"    value={data.selectedDate ?? ''} />
        <RecapRow icon="time-outline"     label="Heure"   value={data.selectedSlot ?? ''} />
      </Card>

      <Input
        label="Motif de la consultation"
        value={motif}
        onChangeText={onMotifChange}
        placeholder="Ex : Contrôle annuel, douleur thoracique…"
        leftIcon={<Ionicons name="create-outline" size={20} color={LUNA_COLORS.textSecondary} />}
      />

      <Button
        title="Confirmer le rendez-vous"
        onPress={onSubmit}
        loading={loading}
        fullWidth
        size="lg"
      />
    </View>
  );
}

function RecapRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={step4Styles.recapRow}>
      <Ionicons name={icon as never} size={16} color={LUNA_COLORS.secondary} />
      <Text style={step4Styles.recapLabel}>{label} :</Text>
      <Text style={step4Styles.recapValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ── Écran principal — Wizard ──────────────────────────────────────────────────
export default function NouveauRdvScreen(): React.JSX.Element {
  const router     = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [step,         setStep]         = useState<Step>(1);
  const [medecins,     setMedecins]     = useState<Medecin[]>([]);
  const [dispos,       setDispos]       = useState<string[]>([]);
  const [loadingMed,   setLoadingMed]   = useState(false);
  const [loadingDispo, setLoadingDispo] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const [wizData, setWizData] = useState<WizardData>({
    patient:      null,
    medecin:      null,
    selectedDate: null,
    selectedSlot: null,
    motif:        '',
    typeRdv:      'CONSULTATION',
  });

  // Chargement des médecins à l'étape 2
  useEffect(() => {
    if (step !== 2 || !cliniqueId || medecins.length > 0) return;
    setLoadingMed(true);
    rdvService.getMedecinsByClinique(cliniqueId)
      .then(setMedecins)
      .catch(() => {})
      .finally(() => setLoadingMed(false));
  }, [step, cliniqueId, medecins.length]);

  // Chargement des disponibilités quand date change
  async function loadDispos(medecinId: string | number, date: string) {
    setLoadingDispo(true);
    setDispos([]);
    try {
      const slots = await rdvService.getDisponibilites(medecinId, date);
      setDispos(slots);
    } catch {
      /* pas de créneaux disponibles */
    } finally {
      setLoadingDispo(false);
    }
  }

  function handleDateChange(date: string) {
    setWizData((p) => ({ ...p, selectedDate: date, selectedSlot: null }));
    if (wizData.medecin) loadDispos(wizData.medecin.id, date);
  }

  function handleSlotChange(slot: string) {
    setWizData((p) => ({ ...p, selectedSlot: slot }));
  }

  // Validation de chaque étape avant passage suivante
  function canProceed(): boolean {
    switch (step) {
      case 1: return Boolean(wizData.patient);
      case 2: return Boolean(wizData.medecin);
      case 3: return Boolean(wizData.selectedDate && wizData.selectedSlot);
      case 4: return Boolean(wizData.motif.trim());
      default: return false;
    }
  }

  function goNext() {
    if (!canProceed()) {
      Alert.alert('Champ manquant', 'Veuillez compléter cette étape avant de continuer.');
      return;
    }
    if (step < 4) setStep((s) => (s + 1) as Step);
    else handleSubmit();
  }

  function goPrev() {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else router.back();
  }

  async function handleSubmit() {
    if (!wizData.patient || !wizData.medecin || !wizData.selectedDate || !wizData.selectedSlot) return;
    setSubmitting(true);
    try {
      const dateHeure = `${wizData.selectedDate}T${wizData.selectedSlot}:00`;
      await rdvService.createRdv({
        patientId: wizData.patient.id,
        medecinId: wizData.medecin.id,
        dateHeure,
        motif:     wizData.motif.trim(),
        typeRdv:   wizData.typeRdv,
      });
      Alert.alert('Succès', 'Le rendez-vous a été créé.', [
        { text: 'OK', onPress: () => router.replace('/(secretaire)/rendez-vous') },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le rendez-vous. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Rendu principal ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête navigation */}
      <View style={styles.navBar}>
        <Pressable onPress={goPrev} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={[typography.h4, styles.navTitle]}>Nouveau rendez-vous</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de progression */}
        <StepBar step={step} />

        {/* Contenu de l'étape */}
        <View style={styles.stepContent}>
          {step === 1 && (
            <Step1Patient
              selected={wizData.patient}
              onSelect={(p) => setWizData((d) => ({ ...d, patient: p }))}
              onNewPatient={() => router.push('/(secretaire)/patients/nouveau')}
            />
          )}
          {step === 2 && (
            <Step2Medecin
              medecins={medecins}
              selected={wizData.medecin}
              onSelect={(m) => setWizData((d) => ({ ...d, medecin: m }))}
              loading={loadingMed}
            />
          )}
          {step === 3 && (
            <Step3DateTime
              selectedDate={wizData.selectedDate}
              selectedSlot={wizData.selectedSlot}
              dispos={dispos}
              loadingDispos={loadingDispo}
              onDateChange={handleDateChange}
              onSlotChange={handleSlotChange}
            />
          )}
          {step === 4 && (
            <Step4Confirm
              data={wizData}
              motif={wizData.motif}
              onMotifChange={(v) => setWizData((d) => ({ ...d, motif: v }))}
              onSubmit={handleSubmit}
              loading={submitting}
            />
          )}
        </View>
      </ScrollView>

      {/* Bouton navigation bas */}
      {step < 4 ? (
        <View style={styles.footer}>
          <Button
            title={step === 3 ? 'Valider le créneau' : 'Suivant'}
            onPress={goNext}
            size="lg"
            fullWidth
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ── Styles partagés ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: LUNA_COLORS.background,
  },
  navBar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  backBtn: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex:      1,
    textAlign: 'center',
    color:     LUNA_COLORS.dark,
  },
  scroll: {
    padding:      spacing.xxl,
    paddingBottom: spacing.huge,
  },
  stepContent: {
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    borderTopWidth:    1,
    borderTopColor:    LUNA_COLORS.border,
  },
});

// ── Styles StepBar ────────────────────────────────────────────────────────────
const stepStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  track: {
    height:          4,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius:    borderRadius.full,
    marginBottom:    spacing.md,
    overflow:        'hidden',
  },
  fill: {
    height:          4,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius:    borderRadius.full,
  },
  dotsRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  dotWrap: {
    alignItems: 'center',
    gap:        spacing.xs,
    flex:       1,
  },
  dot: {
    width:          26,
    height:         26,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: LUNA_COLORS.secondary,
  },
  dotInactive: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth:     1.5,
    borderColor:     LUNA_COLORS.borderDark,
  },
  dotNum: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textDisabled,
  },
  dotNumActive: {
    color: LUNA_COLORS.textInverse,
  },
  dotLabel: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },
  dotLabelActive: {
    color:      LUNA_COLORS.secondary,
    fontWeight: fontWeight.semibold,
  },
});

// ── Styles étape 1 ────────────────────────────────────────────────────────────
const step1Styles = StyleSheet.create({
  selectedCard: {
    marginBottom: spacing.md,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
    fontSize:   fontSize.base,
  },
  name: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.darkest,
  },
  phone: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textSecondary,
  },
  resultsCard: {
    padding:      0,
    marginBottom: spacing.md,
    overflow:     'hidden',
  },
  resultRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing.md,
    paddingVertical:  spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: LUNA_COLORS.border,
  },
  resultAvatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: LUNA_COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  resultAvatarTxt: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.dark,
  },
  resultName: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.textPrimary,
  },
  resultPhone: {
    fontSize: fontSize.xs,
    color:    LUNA_COLORS.textSecondary,
  },
  newBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    alignSelf:      'center',
    paddingVertical: spacing.sm,
    marginTop:       spacing.sm,
  },
  newBtnTxt: {
    color:      LUNA_COLORS.secondary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

// ── Styles étape 2 ────────────────────────────────────────────────────────────
const step2Styles = StyleSheet.create({
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.md,
    padding:           spacing.lg,
    marginBottom:      spacing.md,
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.md,
    borderWidth:       1.5,
    borderColor:       LUNA_COLORS.border,
    ...(shadows.sm as object),
  },
  cardSelected: {
    borderColor:     LUNA_COLORS.secondary,
    backgroundColor: LUNA_COLORS.infoLight,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: LUNA_COLORS.tertiary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarSelected: {
    backgroundColor: LUNA_COLORS.secondary,
  },
  avatarTxt: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
    fontSize:   fontSize.base,
  },
  name: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.darkest,
  },
  nameSelected: {
    color: LUNA_COLORS.secondary,
  },
  specialite: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textSecondary,
  },
  empty: {
    textAlign:  'center',
    color:      LUNA_COLORS.textSecondary,
    fontSize:   fontSize.sm,
    marginTop:  spacing.xl,
  },
});

// ── Styles étape 3 ────────────────────────────────────────────────────────────
const step3Styles = StyleSheet.create({
  sectionLabel: {
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.semibold,
    color:        LUNA_COLORS.dark,
    marginBottom: spacing.sm,
  },
  weekScroll: {
    marginBottom: spacing.sm,
  },
  dayChip: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:      borderRadius.full,
    backgroundColor:   LUNA_COLORS.surfaceLight,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
    marginRight:       spacing.sm,
  },
  dayChipActive: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor:     LUNA_COLORS.secondary,
  },
  dayTxt: {
    fontSize:   fontSize.sm,
    color:      LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.medium,
  },
  dayTxtActive: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
  },
  slotsGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            spacing.sm,
  },
  slotChip: {
    width:           '30%',
    paddingVertical: spacing.sm,
    alignItems:      'center',
    borderRadius:    borderRadius.sm,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderDark,
    opacity:         0.45,
  },
  slotAvailable: {
    opacity:         1,
    backgroundColor: LUNA_COLORS.infoLight,
    borderColor:     LUNA_COLORS.secondary,
  },
  slotActive: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor:     LUNA_COLORS.secondary,
  },
  slotTxt: {
    fontSize:   fontSize.sm,
    color:      LUNA_COLORS.textDisabled,
    fontWeight: fontWeight.medium,
  },
  slotTxtAvailable: {
    color: LUNA_COLORS.secondary,
  },
  slotTxtActive: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
  },
  hint: {
    textAlign:  'center',
    color:      LUNA_COLORS.textSecondary,
    fontSize:   fontSize.sm,
    marginTop:  spacing.xl,
  },
});

// ── Styles étape 4 ────────────────────────────────────────────────────────────
const step4Styles = StyleSheet.create({
  recap: {
    marginBottom: spacing.xl,
    gap:          spacing.sm,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.sm,
    paddingVertical: spacing.xs,
  },
  recapLabel: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.textSecondary,
    width:      60,
  },
  recapValue: {
    flex:       1,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.darkest,
  },
});
