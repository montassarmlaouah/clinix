import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiPost } from '@/src/api/client';
import { PATIENTS } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { useAuthStore } from '@/src/store/auth.store';

interface PatientAdmissionPayload {
  nom:          string;
  prenom:       string;
  dateNaissance: string;
  telephone:    string;
  adresse?:     string;
  cliniqueId:   string | number | null;
  motifAdmission?: string;
  urgence?:     boolean;
}

export default function NouvelleAdmissionScreen(): React.JSX.Element {
  const router           = useRouter();
  const { cliniqueId }   = useAuthStore();

  const [nom, setNom]               = useState('');
  const [prenom, setPrenom]         = useState('');
  const [dateNaissance, setDOB]     = useState('');
  const [telephone, setTel]         = useState('');
  const [adresse, setAdresse]       = useState('');
  const [motif, setMotif]           = useState('');
  const [urgence, setUrgence]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
      Alert.alert('Champs requis', 'Nom, prénom et téléphone sont obligatoires');
      return;
    }
    if (dateNaissance && !/^\d{4}-\d{2}-\d{2}$/.test(dateNaissance)) {
      Alert.alert('Format invalide', 'Date de naissance : AAAA-MM-JJ');
      return;
    }

    setSubmitting(true);
    try {
      const payload: PatientAdmissionPayload = {
        nom:           nom.trim(),
        prenom:        prenom.trim(),
        dateNaissance: dateNaissance || '',
        telephone:     telephone.trim(),
        adresse:       adresse.trim() || undefined,
        cliniqueId,
        motifAdmission: motif.trim() || undefined,
        urgence,
      };
      await apiPost(PATIENTS.CREATE, payload);
      Alert.alert('Admission enregistrée', `${prenom} ${nom} a été admis(e) avec succès`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer l\'admission');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Identity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identité du patient</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom *"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={nom}
          onChangeText={setNom}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          placeholder="Prénom *"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={prenom}
          onChangeText={setPrenom}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Date de naissance (AAAA-MM-JJ)"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={dateNaissance}
          onChangeText={setDOB}
          keyboardType="numeric"
          maxLength={10}
        />
        <TextInput
          style={styles.input}
          placeholder="Téléphone *"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={telephone}
          onChangeText={setTel}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Adresse (optionnel)"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={adresse}
          onChangeText={setAdresse}
        />
      </View>

      {/* Admission info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations d'admission</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Motif d'admission (optionnel)"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={motif}
          onChangeText={setMotif}
          multiline
          numberOfLines={3}
        />
        <View style={styles.switchRow}>
          <Ionicons name="warning-outline" size={18} color={LUNA_COLORS.warning} />
          <Text style={styles.switchLabel}>Admission urgente</Text>
          <Switch
            value={urgence}
            onValueChange={setUrgence}
            trackColor={{ false: LUNA_COLORS.textDisabled, true: LUNA_COLORS.warning }}
            thumbColor={urgence ? LUNA_COLORS.warning : LUNA_COLORS.surface}
          />
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={styles.submitBtnText}>Enregistrer l'admission</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },

  section: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    padding:         spacing.md,
    gap:             spacing.sm,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    4,
    elevation:       2,
  },
  sectionTitle: {
    fontSize:   fontSize.md,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth:     1,
    borderColor:     LUNA_COLORS.tertiary + '55',
    borderRadius:    borderRadius.sm,
    padding:         spacing.sm,
    fontSize:        fontSize.sm,
    color:           LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.background,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  switchLabel: { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },

  submitBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    padding:         spacing.md,
    borderRadius:    borderRadius.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
    fontSize:   fontSize.md,
  },
});
