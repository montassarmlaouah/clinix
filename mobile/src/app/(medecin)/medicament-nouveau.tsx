import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { DEMANDES_MEDICAMENT, MEDICAMENTS, PATIENTS } from '@/src/api/endpoints';
import { demandesMedicamentService } from '@/src/api/services/demandes-medicament.service';
import { Button, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Patient { id: string; nom?: string; prenom?: string; }
interface Medicament { id: string; nom?: string; formeGalenique?: string; }
interface LigneItem {
  medicamentId: string;
  medicamentNom: string;
  quantite: number;
  instructions?: string;
}

// ── Picker modal générique ────────────────────────────────────────────────────
function PickerModal<T extends { id: string; nom?: string; prenom?: string }>({
  visible,
  title,
  items,
  onSelect,
  onClose,
  labelKey,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  labelKey?: (item: T) => string;
}): React.JSX.Element {
  const [q, setQ] = useState('');
  const filtered = items.filter((i) => {
    const label = labelKey ? labelKey(i) : `${i.prenom ?? ''} ${i.nom ?? ''}`.trim();
    return label.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <Text style={modal.title}>{title}</Text>
          <TextInput
            style={modal.search}
            placeholder="Rechercher…"
            value={q}
            onChangeText={setQ}
            placeholderTextColor={LUNA_COLORS.textSecondary}
          />
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => {
              const label = labelKey ? labelKey(item) : `${item.prenom ?? ''} ${item.nom ?? ''}`.trim();
              return (
                <Pressable
                  style={modal.item}
                  onPress={() => { onSelect(item); onClose(); setQ(''); }}
                >
                  <Text style={modal.itemText}>{label}</Text>
                </Pressable>
              );
            }}
          />
          <Pressable style={modal.cancelBtn} onPress={onClose}>
            <Text style={modal.cancelText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────
export default function NouvelleDemandesMedicamentScreen(): React.JSX.Element {
  const router = useRouter();
  const userId   = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [patients, setPatients]       = useState<Patient[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving]           = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient]     = useState<Patient | null>(null);
  const [notes, setNotes]                         = useState('');
  const [items, setItems]                         = useState<LigneItem[]>([]);

  // Picker modal state
  const [showPatientPicker, setShowPatientPicker]     = useState(false);
  const [showMedPicker, setShowMedPicker]             = useState(false);

  // Current item being built
  const [selectedMed, setSelectedMed]   = useState<Medicament | null>(null);
  const [quantite, setQuantite]         = useState('1');
  const [instructions, setInstructions] = useState('');

  // ── Load reference data ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [pats, meds] = await Promise.all([
          apiGet<Patient[]>(cliniqueId ? PATIENTS.BY_CLINIQUE(cliniqueId) : PATIENTS.LIST),
          apiGet<Medicament[]>(MEDICAMENTS.LIST),
        ]);
        setPatients(pats ?? []);
        setMedicaments(meds ?? []);
      } catch {
        /* ignore */
      } finally {
        setLoadingData(false);
      }
    };
    void load();
  }, [cliniqueId]);

  // ── Ajouter un médicament à la liste ────────────────────────────────────
  function ajouterMedicament() {
    if (!selectedMed) return;
    const qty = parseInt(quantite, 10);
    if (!qty || qty < 1) {
      Alert.alert('Erreur', 'Quantité invalide.');
      return;
    }
    const exists = items.find((i) => i.medicamentId === selectedMed.id);
    if (exists) {
      Alert.alert('Doublon', 'Ce médicament est déjà dans la liste.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        medicamentId: selectedMed.id,
        medicamentNom: selectedMed.nom ?? '—',
        quantite: qty,
        instructions: instructions.trim() || undefined,
      },
    ]);
    setSelectedMed(null);
    setQuantite('1');
    setInstructions('');
  }

  function retirerMedicament(medicamentId: string) {
    setItems((prev) => prev.filter((i) => i.medicamentId !== medicamentId));
  }

  // ── Soumettre la demande ─────────────────────────────────────────────────
  async function soumettre() {
    if (!selectedPatient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un patient.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un médicament.');
      return;
    }
    setSaving(true);
    try {
      await demandesMedicamentService.create({
        patientId: selectedPatient.id,
        demandeurId: userId,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          medicamentId: i.medicamentId,
          quantite: i.quantite,
          instructions: i.instructions,
        })),
      });
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la demande.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Nouvelle demande" subtitle="Médicaments pour la pharmacie" />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Patient ─────────────────────────────────────────────────────── */}
        <Text style={styles.label}>Patient *</Text>
        <Pressable style={styles.selector} onPress={() => setShowPatientPicker(true)}>
          <Text style={selectedPatient ? styles.selectorText : styles.placeholder}>
            {selectedPatient
              ? `${selectedPatient.prenom ?? ''} ${selectedPatient.nom ?? ''}`.trim()
              : 'Sélectionner un patient…'}
          </Text>
        </Pressable>

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        <Text style={styles.label}>Notes / observations</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Contexte clinique, urgence…"
          placeholderTextColor={LUNA_COLORS.textSecondary}
          multiline
          textAlignVertical="top"
        />

        {/* ── Ajouter un médicament ───────────────────────────────────────── */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>Ajouter un médicament</Text>

        <Pressable style={styles.selector} onPress={() => setShowMedPicker(true)}>
          <Text style={selectedMed ? styles.selectorText : styles.placeholder}>
            {selectedMed ? (selectedMed.nom ?? '—') : 'Choisir un médicament…'}
          </Text>
        </Pressable>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.labelSm}>Quantité</Text>
            <TextInput
              style={styles.input}
              value={quantite}
              onChangeText={setQuantite}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={LUNA_COLORS.textSecondary}
            />
          </View>
          <View style={{ flex: 2, marginLeft: spacing.sm }}>
            <Text style={styles.labelSm}>Instructions (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Ex: matin et soir"
              placeholderTextColor={LUNA_COLORS.textSecondary}
            />
          </View>
        </View>

        <Pressable
          style={[styles.addBtn, !selectedMed && styles.addBtnDisabled]}
          onPress={ajouterMedicament}
          disabled={!selectedMed}
        >
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>

        {/* ── Liste des médicaments ajoutés ───────────────────────────────── */}
        {items.length > 0 ? (
          <View style={styles.itemsCard}>
            <Text style={styles.itemsTitle}>Médicaments ({items.length})</Text>
            {items.map((item) => (
              <View key={item.medicamentId} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.medicamentNom}</Text>
                  <Text style={styles.itemMeta}>
                    Qté : {item.quantite}{item.instructions ? ` — ${item.instructions}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => retirerMedicament(item.medicamentId)}>
                  <Text style={styles.removeBtn}>Retirer</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Soumettre ──────────────────────────────────────────────────── */}
        <Button
          title="Envoyer à la pharmacie"
          onPress={soumettre}
          loading={saving}
          fullWidth
        />
      </ScrollView>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <PickerModal
        visible={showPatientPicker}
        title="Sélectionner un patient"
        items={patients}
        onSelect={setSelectedPatient}
        onClose={() => setShowPatientPicker(false)}
      />
      <PickerModal
        visible={showMedPicker}
        title="Choisir un médicament"
        items={medicaments as unknown as Patient[]}
        labelKey={(m) => (m as unknown as Medicament).nom ?? m.id}
        onSelect={(m) => setSelectedMed(m as unknown as Medicament)}
        onClose={() => setShowMedPicker(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: LUNA_COLORS.background },
  body:  { padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.textSecondary },
  labelSm: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: 4 },
  selector: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    marginTop: 4,
  },
  selectorText: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  placeholder:  { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    marginTop: 4,
  },
  area: { minHeight: 80, textAlignVertical: 'top' },
  row:  { flexDirection: 'row', marginTop: spacing.sm },
  addBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  itemsCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...(shadows.sm as object),
  },
  itemsTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, marginBottom: spacing.sm },
  itemRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  itemName: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  itemMeta: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  removeBtn: { fontSize: fontSize.xs, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.sm,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.sm,
  },
  item: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderSubtle,
  },
  itemText: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
  cancelBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    padding: spacing.sm,
  },
  cancelText: { fontSize: fontSize.base, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
});
