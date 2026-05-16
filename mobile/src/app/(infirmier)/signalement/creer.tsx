import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LoadingOverlay } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { INFIRMIER_WORKSPACE } from '@/src/api/endpoints';
import { apiPost } from '@/src/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface PatientResult {
  id: string;
  nom: string;
  prenom: string;
}

interface MedecinOption {
  id: string;
  nom: string;
  prenom: string;
  specialite?: string;
}

type TypeSignalement = 'CHUTE' | 'HEMORRAGIE' | 'DOULEUR_AIGUE' | 'TROUBLE_CONSCIENCE' | 'AUTRE';

const TYPES: Array<{ value: TypeSignalement; label: string; icon: string }> = [
  { value: 'CHUTE', label: 'Chute', icon: '🪜' },
  { value: 'HEMORRAGIE', label: 'Hémorragie', icon: '🩸' },
  { value: 'DOULEUR_AIGUE', label: 'Douleur aiguë', icon: '😣' },
  { value: 'TROUBLE_CONSCIENCE', label: 'Trouble conscience', icon: '🧠' },
  { value: 'AUTRE', label: 'Autre', icon: '⚠️' },
];

export default function CreerSignalementScreen() {
  const router = useRouter();
  const { userId: userIdRaw, cliniqueId } = useAuthStore(); const userId = String(userIdRaw ?? "");

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [type, setType] = useState<TypeSignalement>('AUTRE');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<'NORMALE' | 'URGENTE'>('NORMALE');
  const [medecins, setMedecins] = useState<MedecinOption[]>([]);
  const [medecinId, setMedecinId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  // GET /api/medecins/clinique/{id} — MedecinController
  useEffect(() => {
    if (!cliniqueId) return;
    apiGet<MedecinOption[]>(`/api/medecins/clinique/${cliniqueId}`).then(setMedecins).catch(() => {});
  }, [cliniqueId]);

  // GET /api/patients/clinique/{id} — PatientController (/search n'existe pas)
  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setPatientResults([]); return; }
    try {
      const base = cliniqueId
        ? await apiGet<PatientResult[]>(`/api/patients/clinique/${cliniqueId}`)
        : await apiGet<PatientResult[]>('/api/patients');
      const lower = q.toLowerCase();
      setPatientResults(base.filter((p) =>
        p.nom.toLowerCase().includes(lower) || p.prenom.toLowerCase().includes(lower)
      ));
    } catch {
      setPatientResults([]);
    }
  }, [cliniqueId]);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientQuery), 300);
    return () => clearTimeout(t);
  }, [patientQuery, searchPatients]);

  const handleSend = async () => {
    if (!userId || !selectedPatient || !description.trim()) {
      Alert.alert('Champs requis', 'Sélectionnez un patient et saisissez une description.');
      return;
    }
    setSending(true);
    try {
      await apiPost(INFIRMIER_WORKSPACE.SIGNALEMENT_MEDECIN(userId), {
        patientId: selectedPatient.id,
        type,
        description: description.trim(),
        priorite,
        medecinDestinataireId: medecinId,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'envoyer le signalement');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Nouveau signalement</Text>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.form}>
            {/* Patient */}
            <Text style={styles.label}>Patient *</Text>
            {selectedPatient ? (
              <View style={styles.selectedChip}>
                <Text style={styles.selectedText}>{selectedPatient.prenom} {selectedPatient.nom}</Text>
                <Pressable onPress={() => { setSelectedPatient(null); setPatientQuery(''); }}>
                  <Ionicons name="close-circle" size={18} color={LUNA_COLORS.secondary} />
                </Pressable>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={patientQuery}
                  onChangeText={setPatientQuery}
                  placeholder="Rechercher un patient..."
                  placeholderTextColor={LUNA_COLORS.textDisabled}
                />
                {patientResults.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.suggestion}
                    onPress={() => { setSelectedPatient(p); setPatientQuery(''); setPatientResults([]); }}
                  >
                    <Text style={styles.suggestionText}>{p.prenom} {p.nom}</Text>
                  </Pressable>
                ))}
              </>
            )}

            {/* Type */}
            <Text style={styles.label}>Type *</Text>
            <View style={styles.typesGrid}>
              {TYPES.map(({ value, label, icon }) => (
                <Pressable
                  key={value}
                  style={[styles.typeBtn, type === value && styles.typeBtnSelected]}
                  onPress={() => setType(value)}
                >
                  <Text style={styles.typeIcon}>{icon}</Text>
                  <Text style={[styles.typeLabel, type === value && styles.typeLabelSelected]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Priorité */}
            <Text style={styles.label}>Priorité</Text>
            <View style={styles.prioriteRow}>
              {(['NORMALE', 'URGENTE'] as const).map((p) => (
                <Pressable
                  key={p}
                  style={[styles.prioriteBtn, priorite === p && (p === 'URGENTE' ? styles.prioriteUrgente : styles.prioriteNormale)]}
                  onPress={() => setPriorite(p)}
                >
                  <Text style={[styles.prioriteText, priorite === p && styles.prioriteTextSelected]}>
                    {p === 'URGENTE' ? '🚨 Urgente' : 'Normale'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez la situation clinique..."
              placeholderTextColor={LUNA_COLORS.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Médecin */}
            {medecins.length > 0 && (
              <>
                <Text style={styles.label}>Médecin destinataire (optionnel)</Text>
                {medecins.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.medecinBtn, medecinId === m.id && styles.medecinBtnSelected]}
                    onPress={() => setMedecinId(medecinId === m.id ? undefined : m.id)}
                  >
                    <Text style={styles.medecinText}>
                      Dr {m.prenom} {m.nom}{m.specialite ? ` — ${m.specialite}` : ''}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Button
          title="Envoyer le signalement"
          onPress={handleSend}
          loading={sending}
          style={priorite === 'URGENTE' ? styles.btnUrgent : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.border,
  },
  backBtn: { padding: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },
  listContent: { flexGrow: 1 },
  form: { padding: spacing.md, gap: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.surface,
  },
  suggestion: {
    padding: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.border,
  },
  suggestionText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LUNA_COLORS.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.secondary,
  },
  selectedText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.semibold },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    backgroundColor: LUNA_COLORS.surface,
    minWidth: 90,
  },
  typeBtnSelected: { borderColor: LUNA_COLORS.error, backgroundColor: LUNA_COLORS.errorLight },
  typeIcon: { fontSize: 20, marginBottom: 2 },
  typeLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  typeLabelSelected: { color: LUNA_COLORS.error, fontWeight: fontWeight.bold },
  prioriteRow: { flexDirection: 'row', gap: spacing.sm },
  prioriteBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    alignItems: 'center',
  },
  prioriteNormale: { backgroundColor: LUNA_COLORS.infoLight, borderColor: LUNA_COLORS.secondary },
  prioriteUrgente: { backgroundColor: LUNA_COLORS.errorLight, borderColor: LUNA_COLORS.error },
  prioriteText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  prioriteTextSelected: { fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },
  descInput: {
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.surface,
    minHeight: 100,
  },
  medecinBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    backgroundColor: LUNA_COLORS.surface,
  },
  medecinBtnSelected: { borderColor: LUNA_COLORS.secondary, backgroundColor: LUNA_COLORS.infoLight },
  medecinText: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.border,
  },
  btnUrgent: { backgroundColor: LUNA_COLORS.error },
});
