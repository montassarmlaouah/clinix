import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  infirmierSoinsService,
  type AdministrationTraitement,
  type ConstanteVitale,
  type NoteHospitalisation,
  type SurveillanceInfirmiere,
} from '@/src/api/services/infirmier-soins.service';
import { patientService, type Patient } from '@/src/api/services/patient.service';
import { LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type SectionKey = 'traitements' | 'planifier' | 'constantes' | 'notes' | 'urgences';

function SectionTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function InfirmierSoinsSurveillanceScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ patientId?: string }>();
  const infirmierId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const prenom = useAuthStore((s) => s.prenom);
  const nom = useAuthStore((s) => s.nom);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(params.patientId ?? '');
  const [section, setSection] = useState<SectionKey>('traitements');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [traitements, setTraitements] = useState<AdministrationTraitement[]>([]);
  const [surveillances, setSurveillances] = useState<SurveillanceInfirmiere[]>([]);
  const [constantesHistorique, setConstantesHistorique] = useState<ConstanteVitale[]>([]);
  const [notesHospitalisation, setNotesHospitalisation] = useState<NoteHospitalisation[]>([]);
  const [hospitalisationEnCoursId, setHospitalisationEnCoursId] = useState('');
  const [alertesCritiques, setAlertesCritiques] = useState<string[]>([]);

  const [constantesForm, setConstantesForm] = useState({
    tension: '',
    temperature: '',
    frequenceCardiaque: '',
    saturationOxygene: '',
    observations: '',
  });

  const [planForm, setPlanForm] = useState({
    heureAdministration: '',
    typeTraitement: 'MEDICAMENT',
    nomMedicament: '',
    dosage: '',
    voieAdministration: 'ORALE',
    observations: '',
  });

  const [noteForm, setNoteForm] = useState('');
  const [urgenceForm, setUrgenceForm] = useState({ localisation: '', message: '' });
  const [manqueForm, setManqueForm] = useState({ equipementNom: '', quantite: '1', message: '' });

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p.id) === String(patientId)),
    [patients, patientId],
  );

  const loadPatients = useCallback(async () => {
    try {
      const data = cliniqueId
        ? await patientService.getByClinique(cliniqueId)
        : await patientService.getAll();
      setPatients(data ?? []);
    } catch {
      setPatients([]);
    }
  }, [cliniqueId]);

  const loadPatientData = useCallback(async () => {
    if (!patientId) {
      setTraitements([]);
      setSurveillances([]);
      setConstantesHistorique([]);
      setNotesHospitalisation([]);
      setHospitalisationEnCoursId('');
      setAlertesCritiques([]);
      return;
    }

    const alerts: string[] = [];
    const fin = new Date();
    const debut = new Date();
    debut.setDate(fin.getDate() - 30);

    try {
      const [traitementsData, survData, alertesData, constantesData, hospData] = await Promise.all([
        infirmierSoinsService.traitementsAVenir(patientId).catch(() => []),
        infirmierSoinsService.historiqueSurveillances(patientId).catch(() => []),
        infirmierSoinsService.alertesSurveillances(patientId).catch(() => []),
        infirmierSoinsService
          .historiqueConstantes(patientId, debut.toISOString(), fin.toISOString())
          .catch(() => []),
        infirmierSoinsService.hospitalisationsPatient(patientId).catch(() => []),
      ]);

      setTraitements(traitementsData ?? []);
      setSurveillances(survData ?? []);
      setConstantesHistorique(constantesData ?? []);

      (alertesData ?? []).forEach((s) => {
        if (s.alerteDeclenche) {
          const when = s.heureObservation
            ? new Date(s.heureObservation).toLocaleString('fr-FR')
            : 'inconnue';
          alerts.push(`Alerte clinique (${when})`);
        }
      });

      const now = Date.now();
      (traitementsData ?? [])
        .filter((t) => !t.administre)
        .forEach((t) => {
          const tms = t.heureAdministration ? new Date(t.heureAdministration).getTime() : NaN;
          if (!Number.isNaN(tms)) {
            const diff = Math.round((tms - now) / 60000);
            if (diff <= 30 && diff >= -15) {
              alerts.push(
                `Prise critique : ${t.nomMedicament ?? 'soin'} (${t.dosage ?? ''})`,
              );
            }
          }
        });

      setAlertesCritiques(alerts);

      const enCours = (hospData ?? []).find((h) => h.statut === 'EN_COURS');
      const hospId = enCours?.id ? String(enCours.id) : '';
      setHospitalisationEnCoursId(hospId);
      if (hospId) {
        const notes = await infirmierSoinsService.notesHospitalisation(hospId).catch(() => []);
        setNotesHospitalisation(notes ?? []);
      } else {
        setNotesHospitalisation([]);
      }
    } catch {
      setError('Impossible de charger les données patient.');
    }
  }, [patientId]);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    await loadPatients();
    await loadPatientData();
    setLoading(false);
    setRefreshing(false);
  }, [loadPatients, loadPatientData]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (params.patientId && params.patientId !== patientId) {
      setPatientId(String(params.patientId));
    }
  }, [params.patientId, patientId]);

  useEffect(() => {
    void loadPatientData();
  }, [patientId, loadPatientData]);

  async function handleMarquerAdministre(item: AdministrationTraitement): Promise<void> {
    if (!item.id) return;
    setSaving(true);
    try {
      await infirmierSoinsService.marquerAdministre(item.id);
      setMessage('Traitement marqué comme administré.');
      await loadPatientData();
    } catch {
      setError('Impossible de marquer le traitement.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePlanifierSoin(): Promise<void> {
    if (!patientId || !infirmierId || !planForm.nomMedicament.trim()) {
      Alert.alert('Champs requis', 'Patient, médicament et heure sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await infirmierSoinsService.planifierSoin({
        patientId,
        infirmierId: String(infirmierId),
        heureAdministration: planForm.heureAdministration || new Date().toISOString(),
        typeTraitement: planForm.typeTraitement,
        nomMedicament: planForm.nomMedicament,
        dosage: planForm.dosage,
        voieAdministration: planForm.voieAdministration,
        observations: planForm.observations,
      });
      setMessage('Soin planifié.');
      setPlanForm({
        heureAdministration: '',
        typeTraitement: 'MEDICAMENT',
        nomMedicament: '',
        dosage: '',
        voieAdministration: 'ORALE',
        observations: '',
      });
      await loadPatientData();
    } catch {
      setError('Impossible de planifier le soin.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEnregistrerConstantes(): Promise<void> {
    if (!patientId || !infirmierId) return;
    const parseNum = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : undefined);
    const tension = parseNum(constantesForm.tension);
    const temperature = parseNum(constantesForm.temperature);
    const frequenceCardiaque = parseNum(constantesForm.frequenceCardiaque);
    const saturationOxygene = parseNum(constantesForm.saturationOxygene);

    if ([tension, temperature, frequenceCardiaque, saturationOxygene].every((v) => v == null)) {
      Alert.alert('Champ requis', 'Saisissez au moins une constante.');
      return;
    }

    setSaving(true);
    try {
      await infirmierSoinsService.enregistrerConstantes({
        patientId,
        infirmierId: String(infirmierId),
        tension,
        temperature,
        frequenceCardiaque,
        saturationOxygene,
      });
      await infirmierSoinsService.enregistrerSurveillance({
        patientId,
        infirmierId: String(infirmierId),
        heureObservation: new Date().toISOString(),
        temperature,
        frequenceCardiaque,
        saturationOxygene,
        observations: constantesForm.observations,
      });
      setMessage('Constantes et surveillance enregistrées.');
      setConstantesForm({
        tension: '',
        temperature: '',
        frequenceCardiaque: '',
        saturationOxygene: '',
        observations: '',
      });
      await loadPatientData();
    } catch {
      setError('Impossible d\'enregistrer les constantes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAjouterNote(): Promise<void> {
    if (!hospitalisationEnCoursId || !noteForm.trim() || !infirmierId) {
      Alert.alert('Note', 'Hospitalisation en cours et contenu requis.');
      return;
    }
    setSaving(true);
    try {
      await infirmierSoinsService.ajouterNoteHospitalisation(hospitalisationEnCoursId, {
        contenu: noteForm.trim(),
        auteurId: String(infirmierId),
        auteurNom: [prenom, nom].filter(Boolean).join(' ') || 'Infirmier',
        auteurRole: 'INFIRMIER',
      });
      setNoteForm('');
      setMessage('Note ajoutée.');
      await loadPatientData();
    } catch {
      setError('Impossible d\'ajouter la note.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUrgence(): Promise<void> {
    if (!patientId || !urgenceForm.message.trim()) {
      Alert.alert('Urgence', 'Message obligatoire.');
      return;
    }
    setSaving(true);
    try {
      const res = await infirmierSoinsService.signalerUrgence({
        patientId,
        localisation: urgenceForm.localisation,
        message: urgenceForm.message,
      });
      setMessage(res.message ?? 'Urgence signalée.');
      setUrgenceForm({ localisation: '', message: '' });
    } catch {
      setError('Échec du signalement urgence.');
    } finally {
      setSaving(false);
    }
  }

  async function handleManqueMateriel(): Promise<void> {
    if (!manqueForm.equipementNom.trim()) {
      Alert.alert('Matériel', 'Nom de l\'équipement requis.');
      return;
    }
    setSaving(true);
    try {
      const res = await infirmierSoinsService.signalerManqueMateriel(manqueForm);
      setMessage(res.message ?? 'Signalement envoyé.');
      setManqueForm({ equipementNom: '', quantite: '1', message: '' });
    } catch {
      setError('Échec du signalement matériel.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && patients.length === 0) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Soins & surveillance" subtitle="Constantes, planification, urgences" />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void loadAll(true); }}
          />
        }
      >
        {message ? (
          <View style={styles.bannerOk}>
            <Text style={styles.bannerOkText}>{message}</Text>
            <Pressable onPress={() => setMessage(null)}><Ionicons name="close" size={16} color={LUNA_COLORS.success} /></Pressable>
          </View>
        ) : null}
        {error ? (
          <View style={styles.bannerErr}>
            <Text style={styles.bannerErrText}>{error}</Text>
            <Pressable onPress={() => setError(null)}><Ionicons name="close" size={16} color={LUNA_COLORS.error} /></Pressable>
          </View>
        ) : null}

        <Text style={styles.label}>Patient</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientRow}>
          {patients.map((p) => {
            const active = String(p.id) === String(patientId);
            return (
              <Pressable
                key={String(p.id)}
                onPress={() => setPatientId(String(p.id))}
                style={[styles.patientChip, active && styles.patientChipActive]}
              >
                <Text style={[styles.patientChipText, active && styles.patientChipTextActive]}>
                  {p.prenom} {p.nom}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedPatient ? (
          <Text style={styles.patientHint}>
            Dossier : {selectedPatient.prenom} {selectedPatient.nom}
          </Text>
        ) : (
          <Text style={styles.patientHint}>Sélectionnez un patient pour commencer.</Text>
        )}

        {alertesCritiques.length > 0 ? (
          <View style={styles.alertBox}>
            <Ionicons name="warning-outline" size={18} color={LUNA_COLORS.warning} />
            {alertesCritiques.map((a) => (
              <Text key={a} style={styles.alertText}>{a}</Text>
            ))}
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          <SectionTab label="Traitements" active={section === 'traitements'} onPress={() => setSection('traitements')} />
          <SectionTab label="Planifier" active={section === 'planifier'} onPress={() => setSection('planifier')} />
          <SectionTab label="Constantes" active={section === 'constantes'} onPress={() => setSection('constantes')} />
          <SectionTab label="Notes hospi." active={section === 'notes'} onPress={() => setSection('notes')} />
          <SectionTab label="Urgences" active={section === 'urgences'} onPress={() => setSection('urgences')} />
        </ScrollView>

        {!patientId ? (
          <Text style={styles.emptyHint}>Choisissez un patient pour afficher les sections.</Text>
        ) : null}

        {patientId && section === 'traitements' ? (
          <View style={styles.card}>
            {traitements.length === 0 ? (
              <Text style={styles.emptyHint}>Aucun traitement à venir.</Text>
            ) : (
              traitements.map((t) => (
                <View key={String(t.id)} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{t.nomMedicament ?? t.typeTraitement ?? 'Soin'}</Text>
                    <Text style={styles.itemMeta}>
                      {t.dosage ?? ''} · {t.heureAdministration ? new Date(t.heureAdministration).toLocaleString('fr-FR') : '—'}
                    </Text>
                  </View>
                  {!t.administre ? (
                    <Pressable
                      style={styles.btnSmall}
                      disabled={saving}
                      onPress={() => void handleMarquerAdministre(t)}
                    >
                      <Text style={styles.btnSmallText}>Administré</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.doneTag}>Fait</Text>
                  )}
                </View>
              ))
            )}
          </View>
        ) : null}

        {patientId && section === 'planifier' ? (
          <View style={styles.card}>
            <Field label="Médicament / soin" value={planForm.nomMedicament} onChange={(v) => setPlanForm((p) => ({ ...p, nomMedicament: v }))} />
            <Field label="Dosage" value={planForm.dosage} onChange={(v) => setPlanForm((p) => ({ ...p, dosage: v }))} />
            <Field label="Heure (ISO ou texte)" value={planForm.heureAdministration} onChange={(v) => setPlanForm((p) => ({ ...p, heureAdministration: v }))} />
            <Field label="Observations" value={planForm.observations} onChange={(v) => setPlanForm((p) => ({ ...p, observations: v }))} multiline />
            <Pressable style={styles.btnPrimary} disabled={saving} onPress={() => void handlePlanifierSoin()}>
              <Text style={styles.btnPrimaryText}>{saving ? '…' : 'Planifier le soin'}</Text>
            </Pressable>
          </View>
        ) : null}

        {patientId && section === 'constantes' ? (
          <View style={styles.card}>
            <Field label="Tension" value={constantesForm.tension} onChange={(v) => setConstantesForm((p) => ({ ...p, tension: v }))} keyboardType="numeric" />
            <Field label="Température °C" value={constantesForm.temperature} onChange={(v) => setConstantesForm((p) => ({ ...p, temperature: v }))} keyboardType="decimal-pad" />
            <Field label="FC bpm" value={constantesForm.frequenceCardiaque} onChange={(v) => setConstantesForm((p) => ({ ...p, frequenceCardiaque: v }))} keyboardType="numeric" />
            <Field label="SpO2 %" value={constantesForm.saturationOxygene} onChange={(v) => setConstantesForm((p) => ({ ...p, saturationOxygene: v }))} keyboardType="numeric" />
            <Field label="Observations" value={constantesForm.observations} onChange={(v) => setConstantesForm((p) => ({ ...p, observations: v }))} multiline />
            <Pressable style={styles.btnPrimary} disabled={saving} onPress={() => void handleEnregistrerConstantes()}>
              <Text style={styles.btnPrimaryText}>{saving ? '…' : 'Enregistrer constantes + surveillance'}</Text>
            </Pressable>
            {constantesHistorique.slice(0, 5).map((c) => (
              <Text key={String(c.id)} style={styles.historyLine}>
                {c.dateMesure ? new Date(c.dateMesure).toLocaleString('fr-FR') : '—'} · T {c.temperature ?? '—'} · FC {c.frequenceCardiaque ?? '—'}
              </Text>
            ))}
            {surveillances.slice(0, 3).map((s) => (
              <Text key={String(s.id)} style={styles.historyLine}>
                Surveillance {s.heureObservation ? new Date(s.heureObservation).toLocaleString('fr-FR') : '—'}
              </Text>
            ))}
          </View>
        ) : null}

        {patientId && section === 'notes' ? (
          <View style={styles.card}>
            {!hospitalisationEnCoursId ? (
              <Text style={styles.emptyHint}>Aucune hospitalisation en cours pour ce patient.</Text>
            ) : (
              <>
                <Field label="Nouvelle note" value={noteForm} onChange={setNoteForm} multiline />
                <Pressable style={styles.btnPrimary} disabled={saving} onPress={() => void handleAjouterNote()}>
                  <Text style={styles.btnPrimaryText}>Ajouter la note</Text>
                </Pressable>
                {notesHospitalisation.map((n) => (
                  <View key={String(n.id)} style={styles.noteItem}>
                    <Text style={styles.noteMeta}>{n.auteurNom ?? '—'} · {n.dateCreation ? new Date(n.dateCreation).toLocaleString('fr-FR') : ''}</Text>
                    <Text style={styles.noteBody}>{n.contenu}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : null}

        {patientId && section === 'urgences' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Signaler une urgence</Text>
            <Field label="Localisation" value={urgenceForm.localisation} onChange={(v) => setUrgenceForm((p) => ({ ...p, localisation: v }))} />
            <Field label="Message" value={urgenceForm.message} onChange={(v) => setUrgenceForm((p) => ({ ...p, message: v }))} multiline />
            <Pressable style={[styles.btnPrimary, styles.btnDanger]} disabled={saving} onPress={() => void handleUrgence()}>
              <Text style={styles.btnPrimaryText}>Signaler urgence</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Manque de matériel</Text>
            <Field label="Équipement" value={manqueForm.equipementNom} onChange={(v) => setManqueForm((p) => ({ ...p, equipementNom: v }))} />
            <Field label="Quantité" value={manqueForm.quantite} onChange={(v) => setManqueForm((p) => ({ ...p, quantite: v }))} keyboardType="numeric" />
            <Field label="Message" value={manqueForm.message} onChange={(v) => setManqueForm((p) => ({ ...p, message: v }))} multiline />
            <Pressable style={styles.btnPrimary} disabled={saving} onPress={() => void handleManqueMateriel()}>
              <Text style={styles.btnPrimaryText}>Signaler manque</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={LUNA_COLORS.textDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80, gap: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textSecondary },
  patientRow: { marginVertical: spacing.sm },
  patientChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    marginRight: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  patientChipActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  patientChipText: { fontSize: fontSize.sm, color: LUNA_COLORS.darkest },
  patientChipTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  patientHint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginBottom: spacing.sm },
  alertBox: {
    backgroundColor: LUNA_COLORS.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 4,
  },
  alertText: { fontSize: fontSize.sm, color: LUNA_COLORS.warning },
  tabs: { marginVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    marginRight: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  tabActive: { backgroundColor: LUNA_COLORS.secondaryLight, borderColor: LUNA_COLORS.secondary },
  tabText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  tabTextActive: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    gap: spacing.md,
    ...(shadows.sm as object),
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  itemMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  btnSmall: {
    backgroundColor: LUNA_COLORS.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  btnSmallText: { color: LUNA_COLORS.textInverse, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  doneTag: { fontSize: fontSize.xs, color: LUNA_COLORS.success, fontWeight: fontWeight.bold },
  field: { gap: 4 },
  fieldLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  btnPrimary: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  btnDanger: { backgroundColor: LUNA_COLORS.error },
  btnPrimaryText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  emptyHint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, textAlign: 'center', padding: spacing.lg },
  historyLine: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  noteItem: { borderTopWidth: 1, borderTopColor: LUNA_COLORS.borderSubtle, paddingTop: spacing.sm },
  noteMeta: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  noteBody: { fontSize: fontSize.sm, color: LUNA_COLORS.darkest, marginTop: 4 },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  bannerOk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LUNA_COLORS.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  bannerOkText: { color: LUNA_COLORS.success, flex: 1, fontSize: fontSize.sm },
  bannerErr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LUNA_COLORS.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  bannerErrText: { color: LUNA_COLORS.error, flex: 1, fontSize: fontSize.sm },
});
