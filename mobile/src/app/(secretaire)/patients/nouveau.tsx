import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input } from '@/src/components/common';
import { patientService, type CreatePatientPayload } from '@/src/api/services/patient.service';
import { apiGet } from '@/src/api/client';
import { MEDECINS, CHAMBRES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MedecinOption {
  id:         string | number;
  nom:        string;
  prenom:     string;
  specialite: string;
}

interface ChambreOption {
  id: string;
  numero: string;
  type: string;
}

// ── Validation ────────────────────────────────────────────────────────────────
const PHONE_RE = /^(\+216)?[2459]\d{7}$/;
const CIN_RE   = /^[0-9]{8}$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;

interface FormFields {
  nom:                  string;
  prenom:               string;
  telephone:            string;
  dateNaissance:        string;
  adresse:              string;
  cin:                  string;
  sexe:                 'HOMME' | 'FEMME' | '';
  numeroSecuriteSociale:string;
  typeAdmission:        string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

function validate(f: FormFields): FormErrors {
  const e: FormErrors = {};

  if (!f.nom.trim() || f.nom.trim().length < 2)
    e.nom = 'Le nom doit contenir au moins 2 caractères.';

  if (!f.prenom.trim() || f.prenom.trim().length < 2)
    e.prenom = 'Le prénom doit contenir au moins 2 caractères.';

  const tel = f.telephone.replace(/\s/g, '');
  if (!PHONE_RE.test(tel))
    e.telephone = 'Numéro invalide. Ex : 55 123 456 ou +216 55 123 456';

  if (!DATE_RE.test(f.dateNaissance)) {
    e.dateNaissance = 'Format attendu : YYYY-MM-DD';
  } else {
    const d = new Date(f.dateNaissance);
    if (isNaN(d.getTime()) || d >= new Date())
      e.dateNaissance = 'La date de naissance doit être dans le passé.';
  }

  if (!f.adresse.trim() || f.adresse.trim().length < 5)
    e.adresse = 'Veuillez saisir une adresse valide.';

  if (!CIN_RE.test(f.cin.trim()))
    e.cin = 'Le CIN doit contenir exactement 8 chiffres.';

  if (!f.sexe)
    e.sexe = 'Le sexe est obligatoire.';

  return e;
}

// ── Toast Banner ──────────────────────────────────────────────────────────────
interface ToastProps {
  visible: boolean;
  message: string;
}

function ToastBanner({ visible, message }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue:         visible ? 1 : 0,
      duration:        300,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View style={[toastStyles.banner, { opacity, pointerEvents: 'none' }]}>
      <Ionicons name="checkmark-circle" size={18} color={LUNA_COLORS.textInverse} />
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  banner: {
    position:          'absolute',
    top:               spacing.xl,
    left:              spacing.xxl,
    right:             spacing.xxl,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    backgroundColor:   LUNA_COLORS.success,
    borderRadius:      borderRadius.md,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex:            999,
    ...(shadows.lg as object),
  },
  text: {
    flex:       1,
    color:      LUNA_COLORS.textInverse,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

// ── Écran ─────────────────────────────────────────────────────────────────────
const INITIAL_FORM: FormFields = {
  nom:                  '',
  prenom:               '',
  telephone:            '',
  dateNaissance:        '',
  adresse:              '',
  cin:                  '',
  sexe:                 '',
  numeroSecuriteSociale:'',
  typeAdmission:        '',
};

const TYPE_ADMISSION_OPTIONS = ['URGENCE', 'PROGRAMMEE', 'AMBULATOIRE', 'HOSPITALISATION'];

export default function NouveauPatientScreen(): React.JSX.Element {
  const router     = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [form,              setForm]             = useState<FormFields>(INITIAL_FORM);
  const [errors,            setErrors]           = useState<FormErrors>({});
  const [loading,           setLoading]          = useState(false);
  const [toast,             setToast]            = useState(false);
  const [medecins,          setMedecins]         = useState<MedecinOption[]>([]);
  const [medecinReferentId, setMedecinReferentId]= useState<string | number | null>(null);
  const [loadingMedecins,   setLoadingMedecins]  = useState(false);

  const [chambres,          setChambres]         = useState<ChambreOption[]>([]);
  const [chambreId,         setChambreId]        = useState<string | null>(null);
  const [loadingChambres,   setLoadingChambres]  = useState(false);

  // ── Charger les médecins de la clinique ────────────────────────────────────
  const loadMedecins = useCallback(async () => {
    if (!cliniqueId) return;
    setLoadingMedecins(true);
    try {
      const data = await apiGet<MedecinOption[]>(MEDECINS.BY_CLINIQUE(cliniqueId));
      setMedecins(data ?? []);
    } catch {
      setMedecins([]);
    } finally {
      setLoadingMedecins(false);
    }
  }, [cliniqueId]);

  // ── Charger les chambres disponibles ───────────────────────────────────────
  const loadChambres = useCallback(async () => {
    if (!cliniqueId) return;
    setLoadingChambres(true);
    try {
      const data = await apiGet<ChambreOption[]>(CHAMBRES.DISPONIBLES);
      setChambres(data ?? []);
    } catch {
      setChambres([]);
    } finally {
      setLoadingChambres(false);
    }
  }, [cliniqueId]);

  useEffect(() => { loadMedecins(); }, [loadMedecins]);
  useEffect(() => { loadChambres(); }, [loadChambres]);

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
      setErrors({ nom: 'Session invalide : clinique introuvable.' });
      return;
    }

    setLoading(true);
    try {
      const payload: CreatePatientPayload = {
        nom:                   form.nom.trim(),
        prenom:                form.prenom.trim(),
        telephone:             form.telephone.replace(/\s/g, ''),
        dateNaissance:         form.dateNaissance.trim(),
        sexe:                  form.sexe,
        adresse:               form.adresse.trim(),
        cliniqueId:            String(cliniqueId),
        groupeSanguin:         '',
        typeAdmission:         form.typeAdmission,
        numeroSecuriteSociale: form.numeroSecuriteSociale.trim(),
        medecinReferentId:     medecinReferentId != null ? String(medecinReferentId) : null,
        chambreId:             chambreId,
      };

      console.log('BODY ENVOYÉ:', JSON.stringify(payload, null, 2));

      await patientService.createPatient(payload);

      setToast(true);
      setTimeout(() => {
        setToast(false);
        router.back();
      }, 2000);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        setErrors({ telephone: 'Ce numéro est déjà associé à un patient.' });
      } else {
        setErrors({ nom: 'Erreur lors de la création. Veuillez réessayer.' });
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedMedecin = medecins.find((m) => m.id === medecinReferentId) ?? null;
  const selectedChambre = chambres.find((c) => c.id === chambreId) ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.navTitle}>Nouveau patient</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          {/* Section identité */}
          <Text style={styles.sectionTitle}>Identité</Text>

          <Input
            label="Nom *"
            value={form.nom}
            onChangeText={(v) => setField('nom', v)}
            error={errors.nom}
            placeholder="Ben Salah"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="Prénom *"
            value={form.prenom}
            onChangeText={(v) => setField('prenom', v)}
            error={errors.prenom}
            placeholder="Mohamed"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="CIN *"
            value={form.cin}
            onChangeText={(v) => setField('cin', v)}
            error={errors.cin}
            placeholder="12345678"
            keyboardType="number-pad"
            maxLength={8}
            leftIcon={<Ionicons name="card-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="Date de naissance * (YYYY-MM-DD)"
            value={form.dateNaissance}
            onChangeText={(v) => setField('dateNaissance', v)}
            error={errors.dateNaissance}
            placeholder="Ex : 1990-06-15"
            keyboardType="numeric"
            leftIcon={<Ionicons name="calendar-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          {/* Sexe */}
          <Text style={styles.fieldLabel}>Sexe *</Text>
          <View style={styles.sexeRow}>
            {(['HOMME', 'FEMME'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sexeBtn, form.sexe === s && styles.sexeBtnActive]}
                onPress={() => setField('sexe', s)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={s === 'HOMME' ? 'male-outline' : 'female-outline'}
                  size={18}
                  color={form.sexe === s ? LUNA_COLORS.textInverse : LUNA_COLORS.secondary}
                />
                <Text style={[styles.sexeBtnText, form.sexe === s && styles.sexeBtnTextActive]}>
                  {s === 'HOMME' ? 'Homme' : 'Femme'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.sexe ? <Text style={styles.errorText}>{errors.sexe}</Text> : null}

          <Input
            label="N° Sécurité Sociale"
            value={form.numeroSecuriteSociale}
            onChangeText={(v) => setField('numeroSecuriteSociale', v)}
            placeholder="Ex : 00123456789"
            keyboardType="number-pad"
            leftIcon={<Ionicons name="shield-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          {/* Section contact */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Contact</Text>

          <Input
            label="Téléphone * (Tunisien)"
            value={form.telephone}
            onChangeText={(v) => setField('telephone', v)}
            error={errors.telephone}
            placeholder="55 123 456 ou +216 55 123 456"
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="Adresse *"
            value={form.adresse}
            onChangeText={(v) => setField('adresse', v)}
            error={errors.adresse}
            placeholder="Rue, Ville, Gouvernorat"
            autoCapitalize="sentences"
            leftIcon={<Ionicons name="location-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          {/* Section admission */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Admission</Text>

          <Text style={styles.fieldLabel}>Type d'admission</Text>
          <View style={styles.admissionRow}>
            {TYPE_ADMISSION_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.admissionChip, form.typeAdmission === t && styles.admissionChipActive]}
                onPress={() => setField('typeAdmission', t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.admissionChipText, form.typeAdmission === t && styles.admissionChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chambre */}
          <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Chambre</Text>
          {loadingChambres ? (
            <ActivityIndicator color={LUNA_COLORS.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <>
              {selectedChambre && (
                <View style={styles.selectedChambreCard}>
                  <Ionicons name="bed" size={18} color={LUNA_COLORS.success} />
                  <Text style={styles.selectedChambreText}>
                    Chambre {selectedChambre.numero} — {selectedChambre.type}
                  </Text>
                  <TouchableOpacity onPress={() => setChambreId(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={LUNA_COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.chambreList}>
                {chambres.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chambreItem, chambreId === c.id && styles.chambreItemActive]}
                    onPress={() => setChambreId(chambreId === c.id ? null : c.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="bed-outline" size={18} color={chambreId === c.id ? LUNA_COLORS.primary : LUNA_COLORS.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.chambreItemNum, chambreId === c.id && styles.chambreItemNumActive]}>
                        Chambre {c.numero}
                      </Text>
                      <Text style={styles.chambreItemType}>{c.type}</Text>
                    </View>
                    {chambreId === c.id && (
                      <Ionicons name="checkmark-circle" size={20} color={LUNA_COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {chambres.length === 0 && (
                  <Text style={styles.emptyText}>Aucune chambre disponible.</Text>
                )}
              </View>
            </>
          )}

          {/* Section médecin référent */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Médecin référent</Text>

          {loadingMedecins ? (
            <ActivityIndicator color={LUNA_COLORS.primary} style={{ marginVertical: spacing.md }} />
          ) : (
            <>
              {selectedMedecin && (
                <View style={styles.selectedMedecinCard}>
                  <Ionicons name="checkmark-circle" size={18} color={LUNA_COLORS.success} />
                  <Text style={styles.selectedMedecinText}>
                    Dr {selectedMedecin.prenom} {selectedMedecin.nom} — {selectedMedecin.specialite}
                  </Text>
                  <TouchableOpacity onPress={() => setMedecinReferentId(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={LUNA_COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.medecinList}>
                {medecins.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.medecinItem,
                      medecinReferentId === m.id && styles.medecinItemActive,
                    ]}
                    onPress={() => setMedecinReferentId(medecinReferentId === m.id ? null : m.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.medecinAvatar}>
                      <Text style={styles.medecinAvatarText}>
                        {m.prenom.charAt(0)}{m.nom.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.medecinInfo}>
                      <Text style={styles.medecinNom}>Dr {m.prenom} {m.nom}</Text>
                      <Text style={styles.medecinSpec}>{m.specialite}</Text>
                    </View>
                    {medecinReferentId === m.id && (
                      <Ionicons name="checkmark-circle" size={20} color={LUNA_COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {medecins.length === 0 && (
                  <Text style={styles.emptyText}>Aucun médecin disponible dans cette clinique.</Text>
                )}
              </View>
            </>
          )}
        </Card>

        <View style={styles.submitWrap}>
          <Button
            title="Créer le patient"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Toast */}
      <ToastBanner
        visible={toast}
        message="Dossier patient créé avec succès"
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
    flex:       1,
    textAlign:  'center',
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
  },
  scroll: {
    padding:       spacing.xxl,
    paddingBottom: spacing.huge,
  },
  formCard: {
    padding: spacing.xxl,
  },
  sectionTitle: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.semibold,
    color:         LUNA_COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  spacing.md,
  },
  fieldLabel: {
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.medium,
    color:        LUNA_COLORS.dark,
    marginBottom: spacing.sm,
  },
  // Sexe picker
  sexeRow: {
    flexDirection: 'row',
    gap:           spacing.md,
    marginBottom:  spacing.md,
  },
  sexeBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    paddingVertical: spacing.md,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  sexeBtnActive: {
    backgroundColor: LUNA_COLORS.primary,
    borderColor:     LUNA_COLORS.primary,
  },
  sexeBtnText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.secondary,
  },
  sexeBtnTextActive: {
    color: LUNA_COLORS.textInverse,
  },
  errorText: {
    fontSize:    fontSize.xs,
    color:       LUNA_COLORS.error,
    marginTop:   -spacing.sm,
    marginBottom: spacing.sm,
  },
  // Admission
  admissionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  admissionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  admissionChipActive: {
    backgroundColor: LUNA_COLORS.primary,
    borderColor: LUNA_COLORS.primary,
  },
  admissionChipText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
  },
  admissionChipTextActive: {
    color: LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
  },
  // Chambre
  selectedChambreCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: LUNA_COLORS.successLight ?? LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    padding:         spacing.md,
    marginBottom:    spacing.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.success,
  },
  selectedChambreText: {
    flex:       1,
    fontSize:   fontSize.sm,
    color:      LUNA_COLORS.dark,
    fontWeight: fontWeight.medium,
  },
  chambreList: {
    gap: spacing.sm,
  },
  chambreItem: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.md,
    padding:         spacing.md,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  chambreItemActive: {
    borderColor:     LUNA_COLORS.primary,
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  chambreItemNum: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
  },
  chambreItemNumActive: {
    color: LUNA_COLORS.primary,
  },
  chambreItemType: {
    fontSize: fontSize.xs,
    color:    LUNA_COLORS.textSecondary,
  },
  // Médecin référent
  selectedMedecinCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: LUNA_COLORS.successLight ?? LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    padding:         spacing.md,
    marginBottom:    spacing.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.success,
  },
  selectedMedecinText: {
    flex:       1,
    fontSize:   fontSize.sm,
    color:      LUNA_COLORS.dark,
    fontWeight: fontWeight.medium,
  },
  medecinList: {
    gap: spacing.sm,
  },
  medecinItem: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.md,
    padding:         spacing.md,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.border,
    backgroundColor: LUNA_COLORS.surface,
  },
  medecinItemActive: {
    borderColor:     LUNA_COLORS.primary,
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  medecinAvatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: LUNA_COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  medecinAvatarText: {
    color:      LUNA_COLORS.textInverse,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  medecinInfo: {
    flex: 1,
  },
  medecinNom: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
  },
  medecinSpec: {
    fontSize: fontSize.xs,
    color:    LUNA_COLORS.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color:    LUNA_COLORS.textSecondary,
    textAlign:'center',
    padding:  spacing.md,
  },
  submitWrap: {
    marginTop: spacing.xl,
  },
});
