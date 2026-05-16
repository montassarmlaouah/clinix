import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, LoadingOverlay } from '@/src/components/common';
import { apiGet, apiPost } from '@/src/api/client';
import { CONSULTATIONS, RDV } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface RdvOption {
  id:        number;
  dateHeure: string;
  motif?:    string;
}

// ── Picker RDV ────────────────────────────────────────────────────────────────
interface RdvPickerProps {
  rdvs:     RdvOption[];
  selected: RdvOption | null;
  onSelect: (rdv: RdvOption) => void;
}

function RdvPicker({ rdvs, selected, onSelect }: RdvPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  function formatRdv(rdv: RdvOption): string {
    const d = new Date(rdv.dateHeure);
    const date = d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} à ${time}${rdv.motif ? ` — ${rdv.motif}` : ''}`;
  }

  return (
    <>
      <Pressable
        style={[pickerStyles.trigger, open && pickerStyles.triggerActive]}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[
            pickerStyles.triggerTxt,
            !selected && pickerStyles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selected ? formatRdv(selected) : 'Sélectionner le RDV concerné (optionnel)'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={LUNA_COLORS.textSecondary}
        />
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={pickerStyles.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={pickerStyles.dropdown}>
            <Text style={pickerStyles.dropdownTitle}>Choisir un RDV</Text>
            <Pressable
              style={[pickerStyles.option, !selected && pickerStyles.optionActive]}
              onPress={() => { onSelect(null as never); setOpen(false); }}
            >
              <Text style={pickerStyles.optionTxt}>— Aucun RDV lié —</Text>
            </Pressable>
            {rdvs.map((rdv) => (
              <Pressable
                key={rdv.id}
                style={[pickerStyles.option, selected?.id === rdv.id && pickerStyles.optionActive]}
                onPress={() => { onSelect(rdv); setOpen(false); }}
              >
                <Text style={pickerStyles.optionTxt} numberOfLines={2}>
                  {formatRdv(rdv)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const pickerStyles = StyleSheet.create({
  trigger: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   LUNA_COLORS.surfaceLight,
    borderWidth:       1.5,
    borderColor:       LUNA_COLORS.borderDark,
    borderRadius:      borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
    marginBottom:      spacing.lg,
  },
  triggerActive: { borderColor: LUNA_COLORS.secondary },
  triggerTxt:    { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  triggerPlaceholder: { color: LUNA_COLORS.textDisabled },
  backdrop: {
    flex:            1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent:  'center',
    padding:         spacing.xxl,
  },
  dropdown: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    paddingVertical: spacing.sm,
    maxHeight:       300,
    ...(shadows.lg as object),
  },
  dropdownTitle: {
    fontSize:          fontSize.sm,
    fontWeight:        fontWeight.semibold,
    color:             LUNA_COLORS.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.border,
    marginBottom:      spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
  },
  optionActive: { backgroundColor: LUNA_COLORS.infoLight },
  optionTxt:    { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
});

// ── Écran Consultation ────────────────────────────────────────────────────────
export default function ConsultationScreen(): React.JSX.Element {
  const router    = useRouter();
  const { id, rdvId } = useLocalSearchParams<{ id: string; rdvId?: string }>();
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [rdvs,        setRdvs]        = useState<RdvOption[]>([]);
  const [selectedRdv, setSelectedRdv] = useState<RdvOption | null>(null);
  const [diagnostic,  setDiagnostic]  = useState('');
  const [traitement,  setTraitement]  = useState('');
  const [notes,       setNotes]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [loadingRdvs, setLoadingRdvs] = useState(true);
  const [successModal, setSuccessModal] = useState(false);

  // Charger les RDV du patient
  useEffect(() => {
    if (!id) return;
    apiGet<RdvOption[]>(RDV.BY_PATIENT(id))
      .then((data) => {
        setRdvs(data);
        // Pré-sélectionner si rdvId fourni
        if (rdvId) {
          const found = data.find((r) => String(r.id) === rdvId);
          if (found) setSelectedRdv(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRdvs(false));
  }, [id, rdvId]);

  async function handleSubmit(draft = false) {
    if (!diagnostic.trim()) {
      Alert.alert('Champ requis', 'Le diagnostic est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      await apiPost(CONSULTATIONS.CREATE, {
        patientId:    Number(id),
        medecinId:    Number(medecinId),
        diagnostic:   diagnostic.trim(),
        traitement:   traitement.trim() || undefined,
        notes:        notes.trim() || undefined,
        rendezVousId: selectedRdv?.id ?? undefined,
        brouillon:    draft,
        organisationId: cliniqueId ?? undefined,
      });
      if (draft) {
        Alert.alert('Brouillon sauvegardé', 'La consultation a été enregistrée en brouillon.');
      } else {
        setSuccessModal(true);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la consultation. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingRdvs) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.navTitle}>Nouvelle consultation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Formulaire */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>RDV concerné</Text>
        <RdvPicker
          rdvs={rdvs}
          selected={selectedRdv}
          onSelect={setSelectedRdv}
        />

        <Text style={styles.sectionTitle}>Diagnostic *</Text>
        <TextInput
          style={[styles.textarea, { minHeight: 100 }]}
          value={diagnostic}
          onChangeText={setDiagnostic}
          placeholder="Décrivez le diagnostic…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Traitement prescrit</Text>
        <TextInput
          style={[styles.textarea, { minHeight: 80 }]}
          value={traitement}
          onChangeText={setTraitement}
          placeholder="Médicaments, durée, posologie…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Notes complémentaires</Text>
        <TextInput
          style={[styles.textarea, { minHeight: 80 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observations, recommandations…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Footer fixe */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.footerBtn}>
            <Button
              title="Brouillon"
              variant="secondary"
              size="lg"
              loading={loading}
              onPress={() => handleSubmit(true)}
              fullWidth
            />
          </View>
          <View style={styles.footerBtn}>
            <Button
              title="Valider"
              size="lg"
              loading={loading}
              onPress={() => handleSubmit(false)}
              fullWidth
            />
          </View>
        </View>
      </View>

      {/* Modal succès */}
      <Modal
        transparent
        visible={successModal}
        animationType="fade"
        onRequestClose={() => setSuccessModal(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.box}>
            <View style={modalStyles.iconWrap}>
              <Ionicons name="checkmark-circle" size={56} color={LUNA_COLORS.success} />
            </View>
            <Text style={modalStyles.title}>Consultation validée</Text>
            <Text style={modalStyles.sub}>
              La consultation a été enregistrée avec succès.
            </Text>
            <View style={modalStyles.actions}>
              <Button
                title="Créer une ordonnance"
                fullWidth
                onPress={() => {
                  setSuccessModal(false);
                  router.push(`/(medecin)/patients/${id}/ordonnance` as never);
                }}
              />
              <Button
                title="Retour au dossier"
                variant="ghost"
                fullWidth
                onPress={() => {
                  setSuccessModal(false);
                  router.back();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: LUNA_COLORS.overlay,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.xxl,
  },
  box: {
    width:           '100%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.lg,
    padding:         spacing.xxl,
    alignItems:      'center',
  },
  iconWrap: { marginBottom: spacing.lg },
  title: {
    fontSize:     fontSize.xl,
    fontWeight:   fontWeight.bold,
    color:        LUNA_COLORS.darkest,
    marginBottom: spacing.sm,
    textAlign:    'center',
  },
  sub: {
    fontSize:     fontSize.base,
    color:        LUNA_COLORS.textSecondary,
    textAlign:    'center',
    marginBottom: spacing.xl,
  },
  actions: { width: '100%', gap: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  navBar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  scroll:   { padding: spacing.xxl, paddingBottom: 120 },
  sectionTitle: {
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.semibold,
    color:        LUNA_COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom:  spacing.sm,
  },
  textarea: {
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.sm,
    borderWidth:       1.5,
    borderColor:       LUNA_COLORS.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.md,
    fontSize:          fontSize.base,
    color:             LUNA_COLORS.textPrimary,
    marginBottom:      spacing.xl,
    ...(shadows.sm as object),
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    borderTopWidth:    1,
    borderTopColor:    LUNA_COLORS.border,
  },
  footerRow: { flexDirection: 'row', gap: spacing.md },
  footerBtn: { flex: 1 },
});
