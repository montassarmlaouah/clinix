import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { DOSSIERS } from '@/src/api/endpoints';
import { patientService } from '@/src/api/services/patient.service';
import { Button, EmptyState } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface PatientRow {
  id: string;
  nom?: string;
  prenom?: string;
}

export function MedecinNotesHubScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
  const load = async () => {
      try {
        const list = cliniqueId
          ? await patientService.getByClinique(cliniqueId)
          : await patientService.getAll();
        setPatients((list as PatientRow[]) ?? []);
      } catch {
        setPatients([]);
      }
    };
    void load();
  }, [cliniqueId]);

  const charger = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const dossier = await apiGet<{ id: string; notesConfidentielles?: string }>(DOSSIERS.BY_PATIENT(selectedId));
      setDossierId(dossier.id);
      setNotes(dossier.notesConfidentielles ?? '');
    } catch {
      setDossierId(null);
      setError('Dossier introuvable ou accès refusé.');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const enregistrer = async () => {
    if (!dossierId) return;
    setSaving(true);
    setError('');
    try {
      await apiPatch(DOSSIERS.NOTES_CONF(dossierId), { notesConfidentielles: notes });
      setSuccess('Notes enregistrées.');
    } catch {
      setError('Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Notes confidentielles" subtitle="Dossier médical sécurisé" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Patient</Text>
        {patients.length === 0 ? (
          <EmptyState icon="person-outline" title="Aucun patient" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {patients.map((p) => {
              const id = String(p.id);
              const active = selectedId === id;
              return (
                <Text
                  key={id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedId(id)}
                >
                  {p.prenom} {p.nom}
                </Text>
              );
            })}
          </ScrollView>
        )}
        <Button title="Charger le dossier" onPress={() => void charger()} disabled={!selectedId || loading} />
        {loading ? <ActivityIndicator color={LUNA_COLORS.secondary} style={{ marginTop: 16 }} /> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {success ? <Text style={styles.ok}>{success}</Text> : null}
        {dossierId ? (
          <>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={8}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes confidentielles…"
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <Button title="Enregistrer" onPress={() => void enregistrer()} loading={saving} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  label: { ...typography.sectionTitle, marginBottom: spacing.sm }, // ✨ titre section
  chips: { marginBottom: spacing.md, maxHeight: 44 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: LUNA_COLORS.secondary, color: LUNA_COLORS.textInverse },
  input: {
    minHeight: 160,
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond input HeroUI
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: LUNA_COLORS.darkest,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
  },
  err: { color: LUNA_COLORS.error, marginTop: spacing.sm },
  ok: { color: LUNA_COLORS.success, marginTop: spacing.sm },
});
