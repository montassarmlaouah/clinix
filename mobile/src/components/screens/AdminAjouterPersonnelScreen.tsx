import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { personnelService } from '@/src/api/services/personnel.service';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import type {
  CreerPersonnelPayload,
  MedecinRattachementResult,
  ModeEnvoiCredentials,
  PersonnelRole,
} from '@/src/types/personnel';
import {
  MODES_ENVOI,
  PERSONNEL_ROLES,
  SPECIALITES_MEDICALES,
} from '@/src/types/personnel';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { normalizeTelephoneDigits, toApiTelephone } from '@/src/utils/telephone';

type WizardStep = 1 | 2 | 3;

function parseRoleParam(raw?: string): PersonnelRole {
  const valid = PERSONNEL_ROLES.map((r) => r.value);
  if (raw && valid.includes(raw as PersonnelRole)) return raw as PersonnelRole;
  return 'MEDECIN';
}

function Field({
  label,
  required,
  error,
  ...rest
}: {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'characters';
}): React.JSX.Element {
  return (
    <View style={field.wrap}>
      <Text style={field.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={rest.value}
        onChangeText={rest.onChangeText}
        placeholder={rest.placeholder}
        keyboardType={rest.keyboardType ?? 'default'}
        autoCapitalize={rest.autoCapitalize ?? 'words'}
        style={[field.input, !!error && field.inputErr]}
        placeholderTextColor={LUNA_COLORS.textDisabled}
      />
      {error ? <Text style={field.err}>{error}</Text> : null}
    </View>
  );
}

const field = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark, marginBottom: spacing.xs },
  input: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  inputErr: { borderColor: LUNA_COLORS.error },
  err: { fontSize: fontSize.xs, color: LUNA_COLORS.error, marginTop: spacing.xs },
});

export function AdminAjouterPersonnelScreen(): React.JSX.Element {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const cliniqueIdRaw = useAuthStore((s) => s.cliniqueId);
  const cliniqueId = cliniqueIdRaw != null ? String(cliniqueIdRaw) : '';

  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [role, setRole] = useState<PersonnelRole>(() => parseRoleParam(roleParam));
  const [cin, setCin] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [modeEnvoi, setModeEnvoi] = useState<ModeEnvoiCredentials>('TUNISIE_SMS');
  const [medecinExistantId, setMedecinExistantId] = useState('');
  const [rechercheQ, setRechercheQ] = useState('');
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [resultatsMedecin, setResultatsMedecin] = useState<MedecinRattachementResult[]>([]);
  const [roleModal, setRoleModal] = useState(false);
  const [specModal, setSpecModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const rattachementMedecin = role === 'MEDECIN' && !!medecinExistantId.trim();

  const clearError = useCallback(() => setError(''), []);

  async function wizardSuivant() {
    clearError();
    if (step === 1) {
      if (!cin.trim()) {
        setError('Le numéro de carte d\'identité (CIN) est obligatoire.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!telephone.trim()) {
        setError('Le téléphone est obligatoire.');
        return;
      }
      const tel = normalizeTelephoneDigits(telephone);
      if (!rattachementMedecin && tel.length !== 8) {
        setError('Le téléphone doit contenir exactement 8 chiffres.');
        return;
      }
      if (!nom.trim()) {
        setError('Le nom est obligatoire.');
        return;
      }
      if (!prenom.trim()) {
        setError('Le prénom est obligatoire.');
        return;
      }
      if (role === 'MEDECIN' && !rattachementMedecin && !specialite.trim()) {
        setError('La spécialité est obligatoire pour un nouveau médecin.');
        return;
      }
      if (!cliniqueId) {
        setError('Clinique non identifiée. Reconnectez-vous.');
        return;
      }

      try {
        const check = await personnelService.verifierTelephone(
          toApiTelephone(telephone),
          medecinExistantId.trim() || undefined,
        );
        if (!check.disponible) {
          const hint =
            check.message ??
            (check.prenom || check.nom
              ? `Ce numéro appartient déjà à ${check.prenom ?? ''} ${check.nom ?? ''}`.trim()
              : 'Ce numéro de téléphone est déjà enregistré.');
          setError(
            `${hint} Choisissez un autre numéro${
              role === 'MEDECIN' ? ' ou rattachez un médecin existant à l\'étape précédente.' : '.'
            }`,
          );
          return;
        }
      } catch {
        setError('Impossible de vérifier le numéro de téléphone. Réessayez.');
        return;
      }

      setStep(3);
    }
  }

  function wizardPrecedent() {
    clearError();
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  async function lancerRechercheMedecin() {
    const q = rechercheQ.trim();
    if (q.length < 2) {
      setError('Saisissez au moins 2 caractères (nom, prénom ou téléphone).');
      return;
    }
    setRechercheLoading(true);
    clearError();
    try {
      const rows = await personnelService.rechercherMedecinsRattachement(q, cin.trim() || undefined);
      setResultatsMedecin(rows ?? []);
    } catch {
      setError('Recherche médecin impossible.');
      setResultatsMedecin([]);
    } finally {
      setRechercheLoading(false);
    }
  }

  function selectionnerMedecin(row: MedecinRattachementResult) {
    setMedecinExistantId(String(row.id));
    setNom(row.nom ?? '');
    setPrenom(row.prenom ?? '');
    setTelephone(normalizeTelephoneDigits(row.telephone));
    if (row.specialite) setSpecialite(row.specialite);
    if (row.numeroPieceIdentite) setCin(row.numeroPieceIdentite);
    setResultatsMedecin([]);
    clearError();
  }

  function effacerMedecinSelectionne() {
    setMedecinExistantId('');
    clearError();
  }

  async function handleSubmit() {
    clearError();
    if (modeEnvoi === 'PDF_CODE' && !email.trim()) {
      setError('L\'e-mail est obligatoire pour le mode e-mail + PDF.');
      return;
    }
    if (!cliniqueId) {
      setError('Clinique non identifiée.');
      return;
    }

    const payload: CreerPersonnelPayload = {
      role,
      cliniqueId,
      numeroPieceIdentite: cin.trim(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: toApiTelephone(telephone),
      modeEnvoiCredentials: modeEnvoi,
    };
    if (role === 'MEDECIN' && specialite.trim()) payload.specialite = specialite.trim();
    if (email.trim()) payload.email = email.trim();
    if (medecinExistantId.trim()) payload.medecinExistantId = medecinExistantId.trim();

    setSaving(true);
    try {
      const check = await personnelService.verifierTelephone(
        payload.telephone,
        payload.medecinExistantId,
      );
      if (!check.disponible) {
        const msg = check.message ?? 'Ce numéro de téléphone est déjà enregistré.';
        setError(msg);
        Alert.alert('Création impossible', msg);
        return;
      }

      const res = await personnelService.creer(payload);
      const msg = res.message ?? 'Personnel créé avec succès.';
      if (res.pdfBase64) {
        Alert.alert('Personnel créé', `${msg}\n\nUn PDF d'invitation a été généré (consultable depuis le web).`, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Personnel créé', msg, [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: string }).message === 'string'
          ? (e as { message: string }).message
          : 'Erreur lors de la création.';
      setError(msg);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('Création impossible', msg);
    } finally {
      setSaving(false);
    }
  }

  const roleLabel = PERSONNEL_ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Nouveau membre"
        subtitle={`Étape ${step} sur 3`}
        showBack
        onBack={() => (step > 1 ? wizardPrecedent() : router.back())}
      />

      <View style={styles.steps}>
        {([1, 2, 3] as WizardStep[]).map((n) => (
          <View key={n} style={[styles.stepDot, step >= n && styles.stepDotOn]}>
            <Text style={[styles.stepNum, step >= n && styles.stepNumOn]}>{n}</Text>
          </View>
        ))}
        <Text style={styles.stepHint}>
          {step === 1 ? 'CIN' : step === 2 ? 'Identité' : 'Envoi des identifiants'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errBox}>
              <Ionicons name="alert-circle-outline" size={18} color={LUNA_COLORS.error} />
              <Text style={styles.errTxt}>{error}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.section}>Carte d&apos;identité</Text>
              <Field
                label="Numéro CIN"
                required
                value={cin}
                onChangeText={(v) => { setCin(v); clearError(); }}
                placeholder="Ex : 12345678"
                autoCapitalize="characters"
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.section}>Identité et affectation</Text>

              <View style={field.wrap}>
                <Text style={field.label}>Rôle *</Text>
                <Pressable style={[field.input, styles.picker]} onPress={() => setRoleModal(true)}>
                  <Text style={styles.pickerTxt}>{roleLabel}</Text>
                  <Ionicons name="chevron-down" size={16} color={LUNA_COLORS.textSecondary} />
                </Pressable>
              </View>

              {role === 'MEDECIN' ? (
                <View style={styles.medecinBlock}>
                  <Text style={styles.subSection}>Rattacher un médecin existant (optionnel)</Text>
                  {medecinExistantId ? (
                    <View style={styles.selectedMed}>
                      <Text style={styles.selectedMedTxt}>
                        Médecin sélectionné — compte existant rattaché à la clinique
                      </Text>
                      <Pressable onPress={effacerMedecinSelectionne}>
                        <Text style={styles.link}>Changer</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Field
                        label="Recherche"
                        value={rechercheQ}
                        onChangeText={setRechercheQ}
                        placeholder="Nom, prénom ou téléphone"
                      />
                      <Pressable style={styles.searchBtn} onPress={() => void lancerRechercheMedecin()}>
                        {rechercheLoading ? (
                          <ActivityIndicator color={LUNA_COLORS.textInverse} />
                        ) : (
                          <Text style={styles.searchBtnTxt}>Rechercher</Text>
                        )}
                      </Pressable>
                      {resultatsMedecin.map((m) => (
                        <Pressable
                          key={m.id}
                          style={styles.resultRow}
                          onPress={() => selectionnerMedecin(m)}
                        >
                          <Text style={styles.resultName}>
                            {m.prenom} {m.nom}
                          </Text>
                          <Text style={styles.resultMeta}>{m.telephone}</Text>
                        </Pressable>
                      ))}
                    </>
                  )}
                </View>
              ) : null}

              <Field label="Nom" required value={nom} onChangeText={setNom} placeholder="Nom" />
              <Field label="Prénom" required value={prenom} onChangeText={setPrenom} placeholder="Prénom" />
              <Field
                label="Téléphone (8 chiffres)"
                required
                value={telephone}
                onChangeText={(v) => setTelephone(v.replace(/\D/g, '').slice(0, 8))}
                placeholder="98765432"
                keyboardType="phone-pad"
              />

              {role === 'MEDECIN' && !rattachementMedecin ? (
                <View style={field.wrap}>
                  <Text style={field.label}>Spécialité *</Text>
                  <Pressable style={[field.input, styles.picker]} onPress={() => setSpecModal(true)}>
                    <Text style={[styles.pickerTxt, !specialite && styles.placeholder]}>
                      {specialite || 'Choisir une spécialité'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={LUNA_COLORS.textSecondary} />
                  </Pressable>
                </View>
              ) : null}

              <Field
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="optionnel"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text style={styles.section}>Mode d&apos;envoi des identifiants</Text>
              {MODES_ENVOI.map((m) => (
                <Pressable
                  key={m.value}
                  style={[styles.modeCard, modeEnvoi === m.value && styles.modeCardOn]}
                  onPress={() => setModeEnvoi(m.value)}
                >
                  <View style={styles.modeRadio}>
                    {modeEnvoi === m.value ? (
                      <View style={styles.modeRadioInner} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeLabel}>{m.label}</Text>
                    <Text style={styles.modeHint}>{m.hint}</Text>
                  </View>
                </Pressable>
              ))}
              {modeEnvoi === 'PDF_CODE' ? (
                <Text style={styles.modeNote}>
                  L&apos;e-mail saisi à l&apos;étape précédente sera utilisé pour l&apos;envoi du PDF.
                </Text>
              ) : null}
            </>
          ) : null}

          <View style={styles.actions}>
            {step > 1 ? (
              <Pressable style={styles.btnOutline} onPress={wizardPrecedent} disabled={saving}>
                <Text style={styles.btnOutlineTxt}>Précédent</Text>
              </Pressable>
            ) : null}
            {step < 3 ? (
              <Pressable
                style={[styles.btnPrimary, step === 1 && { flex: 1 }]}
                onPress={() => void wizardSuivant()}
              >
                <Text style={styles.btnPrimaryTxt}>Suivant</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.btnPrimary, saving && styles.disabled]}
                onPress={() => void handleSubmit()}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={LUNA_COLORS.textInverse} />
                ) : (
                  <Text style={styles.btnPrimaryTxt}>Créer le membre</Text>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={roleModal}
        title="Choisir un rôle"
        items={PERSONNEL_ROLES.map((r) => ({ label: r.label, value: r.value }))}
        onSelect={(v) => {
          setRole(v);
          if (v !== 'MEDECIN') {
            setMedecinExistantId('');
            setResultatsMedecin([]);
          }
        }}
        onClose={() => setRoleModal(false)}
      />
      <PickerModal
        visible={specModal}
        title="Spécialité"
        items={SPECIALITES_MEDICALES.map((s) => ({ label: s, value: s }))}
        onSelect={setSpecialite}
        onClose={() => setSpecModal(false)}
      />
    </LunaScreen>
  );
}

function PickerModal<T extends string>({
  visible,
  title,
  items,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: { label: string; value: T }[];
  onSelect: (v: T) => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pm.overlay} onPress={onClose} />
      <View style={pm.sheet}>
        <Text style={pm.title}>{title}</Text>
        <ScrollView>
          {items.map((item) => (
            <Pressable
              key={item.value}
              style={pm.row}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
            >
              <Text style={pm.rowTxt}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay },
  sheet: {
    maxHeight: '60%',
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark },
  rowTxt: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
});

const styles = StyleSheet.create({
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LUNA_COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: LUNA_COLORS.secondary },
  stepNum: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.bold },
  stepNumOn: { color: LUNA_COLORS.textInverse },
  stepHint: { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginLeft: spacing.sm },
  form: { padding: spacing.xxl, paddingBottom: 100 },
  section: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginBottom: spacing.md,
  },
  subSection: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginBottom: spacing.sm },
  errBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: LUNA_COLORS.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errTxt: { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.error },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerTxt: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  placeholder: { color: LUNA_COLORS.textDisabled },
  medecinBlock: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.md,
  },
  selectedMed: { gap: spacing.xs },
  selectedMedTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.success },
  link: { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  searchBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchBtnTxt: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  resultRow: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  resultName: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  resultMeta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    marginBottom: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
  },
  modeCardOn: { borderColor: LUNA_COLORS.secondary, backgroundColor: LUNA_COLORS.secondaryLight },
  modeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modeRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: LUNA_COLORS.secondary },
  modeLabel: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  modeHint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  modeNote: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  btnOutline: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineTxt: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.button as object),
  },
  btnPrimaryTxt: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  disabled: { opacity: 0.6 },
});
