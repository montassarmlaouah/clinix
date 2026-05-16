import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input } from '@/src/components/common';
import { patientService, type Patient, type UpdatePatientPayload } from '@/src/api/services/patient.service';
import { apiGet, apiPut } from '@/src/api/client';
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

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function EditPatientScreen(): React.JSX.Element {
  const router     = useRouter();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [patient,           setPatient]           = useState<Patient | null>(null);
  const [loadingPatient,    setLoadingPatient]     = useState(true);

  // Form fields
  const [nom,                     setNom]                     = useState('');
  const [prenom,                  setPrenom]                  = useState('');
  const [telephone,               setTelephone]               = useState('');
  const [dateNaissance,           setDateNaissance]           = useState('');
  const [adresse,                 setAdresse]                 = useState('');
  const [sexe,                    setSexe]                    = useState('');
  const [groupeSanguin,           setGroupeSanguin]           = useState('');
  const [typeAdmission,           setTypeAdmission]           = useState('');
  const [numeroSecuriteSociale,   setNumeroSecuriteSociale]   = useState('');

  // Médecin référent
  const [medecins,                setMedecins]                = useState<MedecinOption[]>([]);
  const [medecinReferentId,       setMedecinReferentId]       = useState<string | number | null>(null);
  const [loadingMedecins,         setLoadingMedecins]         = useState(false);

  // Chambre
  const [chambreId,               setChambreId]               = useState<string | null>(null);
  const [chambreNumero,           setChambreNumero]           = useState<string | null>(null);
  const [availableChambres,       setAvailableChambres]       = useState<ChambreOption[]>([]);
  const [showChambreModal,        setShowChambreModal]        = useState(false);
  const [loadingChambres,         setLoadingChambres]         = useState(false);
  const [tempChambreId,           setTempChambreId]           = useState<string | null>(null);

  const [saving,                  setSaving]                  = useState(false);
  const [errors,                  setErrors]                  = useState<Record<string, string>>({});

  // ── Charger le patient ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    patientService.getPatient(id)
      .then((p) => {
        setPatient(p);
        setNom(p.nom ?? '');
        setPrenom(p.prenom ?? '');
        setTelephone(p.telephone ?? '');
        setDateNaissance(p.dateNaissance ?? '');
        setAdresse(p.adresse ?? '');
        setSexe(p.sexe ?? '');
        setGroupeSanguin(p.groupeSanguin ?? '');
        setTypeAdmission(p.typeAdmission ?? '');
        setNumeroSecuriteSociale(p.numeroSecuriteSociale ?? '');
        setMedecinReferentId(p.medecinReferentId ?? null);
        setChambreId(p.chambreId ?? null);
        setChambreNumero(p.chambreNumero ?? null);
      })
      .catch(() => Alert.alert('Erreur', 'Impossible de charger le patient.'))
      .finally(() => setLoadingPatient(false));
  }, [id]);

  // ── Charger la liste des médecins ────────────────────────────────────────
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

  useEffect(() => { loadMedecins(); }, [loadMedecins]);

  // ── Charger les chambres disponibles ─────────────────────────────────────
  const loadAvailableChambres = useCallback(async () => {
    if (!cliniqueId) return;
    setLoadingChambres(true);
    try {
      const data = await apiGet<ChambreOption[]>(CHAMBRES.DISPONIBLES);
      setAvailableChambres(data ?? []);
    } catch {
      setAvailableChambres([]);
    } finally {
      setLoadingChambres(false);
    }
  }, [cliniqueId]);

  const openChambreModal = () => {
    setTempChambreId(chambreId);
    loadAvailableChambres();
    setShowChambreModal(true);
  };

  const confirmChambreChange = () => {
    setChambreId(tempChambreId);
    const selected = availableChambres.find((c) => c.id === tempChambreId);
    setChambreNumero(selected ? selected.numero : null);
    setShowChambreModal(false);
  };

  const handleDischarge = () => {
    Alert.alert(
      'Sortie du patient',
      'Libérer la chambre et marquer le patient comme sorti ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setSaving(true);
            try {
              const payload: UpdatePatientPayload = {
                nom: nom.trim(),
                prenom: prenom.trim(),
                telephone: telephone.replace(/\s/g, ''),
                dateNaissance: dateNaissance.trim() || undefined,
                sexe,
                adresse: adresse.trim(),
                groupeSanguin: groupeSanguin.trim() || undefined,
                typeAdmission: typeAdmission.trim() || undefined,
                numeroSecuriteSociale: numeroSecuriteSociale.trim() || undefined,
                medecinReferentId: medecinReferentId != null ? String(medecinReferentId) : null,
                chambreId: '', // empty string triggers discharge in backend
              };
              await patientService.updatePatient(id, payload);
              setChambreId(null);
              setChambreNumero(null);
              Alert.alert('Succès', 'La chambre a été libérée.');
            } catch {
              Alert.alert('Erreur', 'Impossible de libérer la chambre.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!nom.trim())    errs.nom    = 'Le nom est obligatoire.';
    if (!prenom.trim()) errs.prenom = 'Le prénom est obligatoire.';
    if (!telephone.replace(/\s/g, '').match(/^(\+216)?[2459]\d{7}$/))
      errs.telephone = 'Numéro invalide.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!id) return;
    setSaving(true);
    try {
      const payload: UpdatePatientPayload = {
        nom:                    nom.trim(),
        prenom:                 prenom.trim(),
        telephone:              telephone.replace(/\s/g, ''),
        dateNaissance:          dateNaissance.trim() || undefined,
        sexe,
        adresse:                adresse.trim(),
        groupeSanguin:          groupeSanguin.trim() || undefined,
        typeAdmission:          typeAdmission.trim() || undefined,
        numeroSecuriteSociale:  numeroSecuriteSociale.trim() || undefined,
        medecinReferentId:      medecinReferentId != null ? String(medecinReferentId) : null,
        chambreId:              chambreId,
      };

      console.log('BODY ENVOYÉ (UPDATE):', JSON.stringify(payload, null, 2));

      await patientService.updatePatient(id, payload);
      Alert.alert('Succès', 'Dossier mis à jour.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le dossier.');
    } finally {
      setSaving(false);
    }
  }

  const selectedMedecin = medecins.find((m) => m.id === medecinReferentId) ?? null;

  if (loadingPatient) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {patient ? `${patient.prenom} ${patient.nom}` : 'Modifier patient'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Lien dossier médical (lecture seule) */}
        <TouchableOpacity
          style={styles.dossierBtn}
          onPress={() => router.push(`/(secretaire)/patients/${id}/dossier` as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="folder-open-outline" size={20} color={LUNA_COLORS.secondary} />
          <Text style={styles.dossierBtnText}>Voir le dossier médical</Text>
          <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
        </TouchableOpacity>

        <Card style={styles.formCard}>
          {/* Identité */}
          <Text style={styles.sectionTitle}>Identité</Text>

          <Input
            label="Nom *"
            value={nom}
            onChangeText={(v) => { setNom(v); setErrors((e) => ({ ...e, nom: '' })); }}
            error={errors.nom}
            placeholder="Ben Salah"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />
          <Input
            label="Prénom *"
            value={prenom}
            onChangeText={(v) => { setPrenom(v); setErrors((e) => ({ ...e, prenom: '' })); }}
            error={errors.prenom}
            placeholder="Mohamed"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          {/* Sexe */}
          <Text style={styles.fieldLabel}>Sexe</Text>
          <View style={styles.sexeRow}>
            {(['HOMME', 'FEMME'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sexeBtn, sexe === s && styles.sexeBtnActive]}
                onPress={() => setSexe(s)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={s === 'HOMME' ? 'male-outline' : 'female-outline'}
                  size={18}
                  color={sexe === s ? LUNA_COLORS.textInverse : LUNA_COLORS.secondary}
                />
                <Text style={[styles.sexeBtnText, sexe === s && styles.sexeBtnTextActive]}>
                  {s === 'HOMME' ? 'Homme' : 'Femme'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Date de naissance (YYYY-MM-DD)"
            value={dateNaissance}
            onChangeText={setDateNaissance}
            placeholder="Ex : 1990-06-15"
            keyboardType="numeric"
            leftIcon={<Ionicons name="calendar-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="Groupe sanguin"
            value={groupeSanguin}
            onChangeText={setGroupeSanguin}
            placeholder="Ex : A+"
            autoCapitalize="characters"
            leftIcon={<Ionicons name="water-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="Type d'admission"
            value={typeAdmission}
            onChangeText={setTypeAdmission}
            placeholder="Ex : Urgence, Programmée"
            autoCapitalize="sentences"
            leftIcon={<Ionicons name="medical-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          <Input
            label="N° Sécurité Sociale"
            value={numeroSecuriteSociale}
            onChangeText={setNumeroSecuriteSociale}
            placeholder="Ex : 00123456789"
            keyboardType="number-pad"
            leftIcon={<Ionicons name="shield-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          {/* Contact */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Contact</Text>

          <Input
            label="Téléphone *"
            value={telephone}
            onChangeText={(v) => { setTelephone(v); setErrors((e) => ({ ...e, telephone: '' })); }}
            error={errors.telephone}
            placeholder="55 123 456"
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />
          <Input
            label="Adresse"
            value={adresse}
            onChangeText={setAdresse}
            placeholder="Rue, Ville, Gouvernorat"
            autoCapitalize="sentences"
            leftIcon={<Ionicons name="location-outline" size={20} color={LUNA_COLORS.textSecondary} />}
          />

          {/* Chambre */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Chambre</Text>

          {chambreNumero ? (
            <View style={styles.chambreCard}>
              <Ionicons name="bed" size={20} color={LUNA_COLORS.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.chambreNum}>Chambre {chambreNumero}</Text>
                <Text style={styles.chambreSub}>Patient actuellement hospitalisé</Text>
              </View>
              <TouchableOpacity style={styles.chambreAction} onPress={openChambreModal}>
                <Text style={styles.chambreActionText}>Changer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.chambreEmpty} onPress={openChambreModal}>
              <Ionicons name="bed-outline" size={20} color={LUNA_COLORS.textSecondary} />
              <Text style={styles.chambreEmptyText}>Aucune chambre assignée — Assigner</Text>
            </TouchableOpacity>
          )}

          {chambreNumero && (
            <TouchableOpacity style={styles.dischargeBtn} onPress={handleDischarge} disabled={saving}>
              <Ionicons name="exit-outline" size={16} color={LUNA_COLORS.error} />
              <Text style={styles.dischargeBtnText}>Sortie du patient (libérer la chambre)</Text>
            </TouchableOpacity>
          )}

          {/* Médecin référent */}
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
            title="Enregistrer les modifications"
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Change room modal */}
      <Modal visible={showChambreModal} transparent animationType="slide" onRequestClose={() => setShowChambreModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer de chambre</Text>
              <TouchableOpacity onPress={() => setShowChambreModal(false)}>
                <Ionicons name="close" size={24} color={LUNA_COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {loadingChambres ? (
                <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginVertical: spacing.xl }} />
              ) : (
                <View style={{ gap: spacing.sm, padding: spacing.md }}>
                  {chambreId && (
                    <TouchableOpacity
                      style={[styles.modalChambreItem, tempChambreId === chambreId && styles.modalChambreItemActive]}
                      onPress={() => setTempChambreId(chambreId)}
                    >
                      <Ionicons name="bed" size={18} color={tempChambreId === chambreId ? LUNA_COLORS.primary : LUNA_COLORS.secondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalChambreNum, tempChambreId === chambreId && styles.modalChambreNumActive]}>
                          Chambre actuelle — {chambreNumero}
                        </Text>
                      </View>
                      {tempChambreId === chambreId && <Ionicons name="checkmark-circle" size={20} color={LUNA_COLORS.primary} />}
                    </TouchableOpacity>
                  )}
                  {availableChambres.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.modalChambreItem, tempChambreId === c.id && styles.modalChambreItemActive]}
                      onPress={() => setTempChambreId(c.id)}
                    >
                      <Ionicons name="bed-outline" size={18} color={tempChambreId === c.id ? LUNA_COLORS.primary : LUNA_COLORS.secondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalChambreNum, tempChambreId === c.id && styles.modalChambreNumActive]}>
                          Chambre {c.numero}
                        </Text>
                        <Text style={styles.modalChambreType}>{c.type}</Text>
                      </View>
                      {tempChambreId === c.id && <Ionicons name="checkmark-circle" size={20} color={LUNA_COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                  {availableChambres.length === 0 && !chambreId && (
                    <Text style={styles.emptyText}>Aucune chambre disponible.</Text>
                  )}
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowChambreModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmChambreChange}>
                <Text style={styles.confirmBtnText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: {
    flex: 1, textAlign: 'center',
    fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark,
  },
  scroll:   { padding: spacing.xxl, paddingBottom: 80 },
  formCard: { padding: spacing.xxl },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm, fontWeight: fontWeight.medium,
    color: LUNA_COLORS.dark, marginBottom: spacing.sm,
  },
  sexeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  sexeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border, backgroundColor: LUNA_COLORS.surface,
  },
  sexeBtnActive:     { backgroundColor: LUNA_COLORS.primary, borderColor: LUNA_COLORS.primary },
  sexeBtnText:       { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.secondary },
  sexeBtnTextActive: { color: LUNA_COLORS.textInverse },
  // Chambre
  chambreCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.md, padding: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border,
  },
  chambreNum: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  chambreSub: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  chambreAction: { backgroundColor: LUNA_COLORS.secondary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  chambreActionText: { fontSize: fontSize.xs, color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  chambreEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md, padding: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border,
    borderStyle: 'dashed',
  },
  chambreEmptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  dischargeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.md, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: LUNA_COLORS.error,
    backgroundColor: LUNA_COLORS.errorLight,
  },
  dischargeBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
  // Médecin référent
  selectedMedecinCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: LUNA_COLORS.successLight ?? LUNA_COLORS.background,
    borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm,
  },
  selectedMedecinText: { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.dark },
  medecinList: { gap: spacing.sm },
  medecinItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border, backgroundColor: LUNA_COLORS.surface,
  },
  medecinItemActive: { borderColor: LUNA_COLORS.primary, backgroundColor: LUNA_COLORS.primary + '11' },
  medecinAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  medecinAvatarText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  medecinInfo:  { flex: 1 },
  medecinNom:   { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  medecinSpec:  { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 1 },
  emptyText:    { fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled, textAlign: 'center', padding: spacing.md },
  submitWrap:   { marginTop: spacing.xxl },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay, justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  modalTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: LUNA_COLORS.borderDark ?? '#E0E0E0' },
  modalChambreItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border, backgroundColor: LUNA_COLORS.surface,
  },
  modalChambreItemActive: { borderColor: LUNA_COLORS.primary, backgroundColor: LUNA_COLORS.surfaceLight },
  modalChambreNum: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  modalChambreNumActive: { color: LUNA_COLORS.primary },
  modalChambreType: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  cancelBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.border },
  cancelBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.dark, fontWeight: fontWeight.semibold },
  confirmBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: LUNA_COLORS.secondary },
  confirmBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  dossierBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.border,
  },
  dossierBtnText: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark },
});
