import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Input, LunaFormModal } from '@/src/components/common';
import { patientService, type CreatePatientPayload } from '@/src/api/services/patient.service';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const PHONE_RE = /^(\+216)?[2459]\d{7}$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;

interface FormFields {
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  cin: string;
  sexe: 'HOMME' | 'FEMME' | '';
  numeroSecuriteSociale: string;
  typeAdmission: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

const INITIAL: FormFields = {
  nom: '',
  prenom: '',
  telephone: '',
  dateNaissance: '',
  adresse: '',
  cin: '',
  sexe: '',
  numeroSecuriteSociale: '',
  typeAdmission: '',
};

const TYPE_ADMISSION = ['URGENCE', 'PROGRAMMEE', 'AMBULATOIRE', 'HOSPITALISATION'];

function validate(f: FormFields): FormErrors {
  const e: FormErrors = {};
  if (!f.nom.trim() || f.nom.trim().length < 2) e.nom = 'Au moins 2 caractères.';
  if (!f.prenom.trim() || f.prenom.trim().length < 2) e.prenom = 'Au moins 2 caractères.';
  const tel = f.telephone.replace(/\s/g, '');
  if (!PHONE_RE.test(tel)) e.telephone = 'Ex : 55 123 456';
  if (!DATE_RE.test(f.dateNaissance)) {
    e.dateNaissance = 'Format YYYY-MM-DD';
  } else {
    const d = new Date(f.dateNaissance);
    if (isNaN(d.getTime()) || d >= new Date()) e.dateNaissance = 'Date dans le passé.';
  }
  if (!f.adresse.trim() || f.adresse.trim().length < 5) e.adresse = 'Adresse invalide.';
  if (!/^[0-9]{8}$/.test(f.cin.trim())) e.cin = '8 chiffres.';
  if (!f.sexe) e.sexe = 'Obligatoire.';
  return e;
}

export interface NewPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function NewPatientModal({
  visible,
  onClose,
  onCreated,
}: NewPatientModalProps): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [form, setForm] = useState<FormFields>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset() {
    setForm(INITIAL);
    setErrors({});
    setSubmitError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function setField<K extends keyof FormFields>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!cliniqueId) {
      setSubmitError('Session invalide : clinique introuvable.');
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const payload: CreatePatientPayload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.replace(/\s/g, ''),
        dateNaissance: form.dateNaissance.trim(),
        sexe: form.sexe,
        adresse: form.adresse.trim(),
        cliniqueId: String(cliniqueId),
        groupeSanguin: '',
        typeAdmission: form.typeAdmission,
        numeroSecuriteSociale: form.numeroSecuriteSociale.trim(),
        medecinReferentId: null,
        chambreId: null,
      };
      await patientService.createPatient(payload);
      reset();
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setErrors({ telephone: 'Ce numéro est déjà utilisé.' });
      } else {
        setSubmitError('Erreur lors de la création. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LunaFormModal
      visible={visible}
      title="Nouveau patient"
      icon="person-add-outline"
      submitLabel="Créer le patient"
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={loading}
      submitError={submitError}
    >
      <Text style={s.section}>Identité</Text>
      <Input
        label="Nom *"
        value={form.nom}
        onChangeText={(v) => setField('nom', v)}
        error={errors.nom}
        placeholder="Ben Salah"
        autoCapitalize="words"
      />
      <Input
        label="Prénom *"
        value={form.prenom}
        onChangeText={(v) => setField('prenom', v)}
        error={errors.prenom}
        placeholder="Mohamed"
        autoCapitalize="words"
      />
      <Input
        label="CIN *"
        value={form.cin}
        onChangeText={(v) => setField('cin', v)}
        error={errors.cin}
        placeholder="12345678"
        keyboardType="number-pad"
        maxLength={8}
      />
      <Input
        label="Date de naissance *"
        value={form.dateNaissance}
        onChangeText={(v) => setField('dateNaissance', v)}
        error={errors.dateNaissance}
        placeholder="1990-06-15"
        keyboardType="numeric"
      />
      <Text style={s.label}>Sexe *</Text>
      <View style={s.sexeRow}>
        {(['HOMME', 'FEMME'] as const).map((sx) => (
          <TouchableOpacity
            key={sx}
            style={[s.sexeBtn, form.sexe === sx && s.sexeBtnOn]}
            onPress={() => setField('sexe', sx)}
          >
            <Text style={[s.sexeTxt, form.sexe === sx && s.sexeTxtOn]}>
              {sx === 'HOMME' ? 'Homme' : 'Femme'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.sexe ? <Text style={s.err}>{errors.sexe}</Text> : null}

      <Text style={[s.section, { marginTop: spacing.md }]}>Contact</Text>
      <Input
        label="Téléphone *"
        value={form.telephone}
        onChangeText={(v) => setField('telephone', v)}
        error={errors.telephone}
        placeholder="55 123 456"
        keyboardType="phone-pad"
      />
      <Input
        label="Adresse *"
        value={form.adresse}
        onChangeText={(v) => setField('adresse', v)}
        error={errors.adresse}
        placeholder="Rue, ville"
      />
      <Input
        label="N° Sécurité sociale"
        value={form.numeroSecuriteSociale}
        onChangeText={(v) => setField('numeroSecuriteSociale', v)}
        keyboardType="number-pad"
      />

      <Text style={[s.section, { marginTop: spacing.md }]}>Admission</Text>
      <View style={s.chips}>
        {TYPE_ADMISSION.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.chip, form.typeAdmission === t && s.chipOn]}
            onPress={() => setField('typeAdmission', t)}
          >
            <Text style={[s.chipTxt, form.typeAdmission === t && s.chipTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LunaFormModal>
  );
}

const s = StyleSheet.create({
  section: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.dark,
    marginBottom: spacing.sm,
  },
  sexeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  sexeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.border,
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
  },
  sexeBtnOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  sexeTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  sexeTxtOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  err: { fontSize: fontSize.xs, color: LUNA_COLORS.error, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  chipOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt: { fontSize: fontSize.xs, color: LUNA_COLORS.textPrimary },
  chipTxtOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
});
