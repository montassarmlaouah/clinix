import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { CHAMBRES, MEDICAMENTS, PATIENTS } from '@/src/api/endpoints';
import { demandesMedicamentService } from '@/src/api/services/demandes-medicament.service';
import { LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Patient { id: string; nom?: string; prenom?: string; }
interface Chambre { id: string; numero?: string | number; service?: string; }
interface Medicament { id: string; nom?: string; formeGalenique?: string; }
interface LigneItem {
  medicamentId: string;
  medicamentNom: string;
  quantite: number;
  instructions?: string;
}

// ── Picker modal générique ─────────────────────────────────────────────────────
function PickerModal<T extends { id: string }>({
  visible,
  title,
  items,
  onSelect,
  onClose,
  labelFn,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  labelFn: (item: T) => string;
}): React.JSX.Element {
  const [q, setQ] = useState('');
  const filtered = items.filter((i) => labelFn(i).toLowerCase().includes(q.toLowerCase()));

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
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <Pressable
                style={modal.item}
                onPress={() => { onSelect(item); onClose(); setQ(''); }}
              >
                <Text style={modal.itemText}>{labelFn(item)}</Text>
              </Pressable>
            )}
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
export default function InfirmierNouvelleDemandeScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [patients, setPatients]       = useState<Patient[]>([]);
  const [chambres, setChambres]       = useState<Chambre[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving]           = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedChambre, setSelectedChambre] = useState<Chambre | null>(null);
  const [notes, setNotes]                     = useState('');
  const [items, setItems]                     = useState<LigneItem[]>([]);

  // Picker modal state
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showChambrePicker, setShowChambrePicker] = useState(false);
  const [showMedPicker, setShowMedPicker]         = useState(false);

  // Current médicament being added
  const [selectedMed, setSelectedMed]   = useState<Medicament | null>(null);
  const [quantite, setQuantite]         = useState('1');
  const [instructions, setInstructions] = useState('');

  // ── Load reference data ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [pats, chbrs, meds] = await Promise.all([
          apiGet<Patient[]>(cliniqueId ? PATIENTS.BY_CLINIQUE(cliniqueId) : PATIENTS.LIST),
          apiGet<Chambre[]>(cliniqueId ? CHAMBRES.BY_CLINIQUE(cliniqueId) : []),
          apiGet<Medicament[]>(MEDICAMENTS.LIST),
        ]);
        setPatients(pats ?? []);
        setChambres(chbrs ?? []);
        setMedicaments(meds ?? []);
      } catch {
        /* ignore */
      } finally {
        setLoadingData(false);
      }
    };
    void load();
  }, [cliniqueId]);

  // ── Ajouter un médicament ─────────────────────────────────────────────────
  function ajouterMedicament() {
    if (!selectedMed) return;
    const qty = parseInt(quantite, 10);
    if (!qty || qty < 1) {
      Alert.alert('Erreur', 'Quantité invalide.');
      return;
    }
    if (items.find((i) => i.medicamentId === selectedMed.id)) {
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

  // ── Soumettre ─────────────────────────────────────────────────────────────
  async function soumettre(): Promise<void> {
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
        chambreId: selectedChambre?.id,
        demandeurId: userId,
        cliniqueId: cliniqueId ? String(cliniqueId) : undefined,
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

        {/* ── Patient ──────────────────────────────────────────────────────── */}
        <Text style={styles.label}>Patient *</Text>
        <Pressable style={styles.selector} onPress={() => setShowPatientPicker(true)}>
          <Text style={selectedPatient ? styles.selectorText : styles.placeholder}>
            {selectedPatient
              ? `${selectedPatient.prenom ?? ''} ${selectedPatient.nom ?? ''}`.trim()
              : 'Sélectionner un patient…'}
          </Text>
        </Pressable>

        {/* ── Chambre ──────────────────────────────────────────────────────── */}
        <Text style={styles.label}>Chambre (optionnel)</Text>
        <Pressable style={styles.selector} onPress={() => setShowChambrePicker(true)}>
          <Text style={selectedChambre ? styles.selectorText : styles.placeholder}>
            {selectedChambre
              ? `Chambre ${selectedChambre.numero ?? selectedChambre.id}${selectedChambre.service ? ` — ${selectedChambre.service}` : ''}`
              : 'Sélectionner une chambre…'}
          </Text>
        </Pressable>

        {/* ── Notes ────────────────────────────────────────────────────────── */}
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

        {/* ── Ajouter un médicament ─────────────────────────────────────────── */}
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
              placeholderTextColor={LUNA_COLORS.textSecondary}
            />
          </View>
          <View style={{ flex: 2, marginLeft: spacing.md }}>
            <Text style={styles.labelSm}>Instructions</Text>
            <TextInput
              style={styles.input}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="ex: matin, jeûn…"
              placeholderTextColor={LUNA_COLORS.textSecondary}
            />
          </View>
        </View>

        <Pressable style={styles.addBtn} onPress={ajouterMedicament} disabled={!selectedMed}>
          <Text style={styles.addBtnText}>+ Ajouter à la liste</Text>
        </Pressable>

        {/* ── Liste des médicaments ──────────────────────────────────────────── */}
        {items.length > 0 && (
          <View style={styles.itemsBox}>
            {items.map((item) => (
              <View key={item.medicamentId} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNom}>{item.medicamentNom}</Text>
                  <Text style={styles.itemMeta}>
                    Qté : {item.quantite}{item.instructions ? `  ·  ${item.instructions}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => retirerMedicament(item.medicamentId)}>
                  <Text style={styles.removeBtn}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ── Soumettre ──────────────────────────────────────────────────────── */}
        <Pressable
          style={[styles.submitBtn, saving && styles.submitDisabled]}
          onPress={soumettre}
          disabled={saving}
        >
          <Text style={styles.submitText}>{saving ? 'Envoi en cours…' : 'Envoyer la demande'}</Text>
        </Pressable>
      </ScrollView>

      {/* ── Modales picker ─────────────────────────────────────────────────── */}
      <PickerModal
        visible={showPatientPicker}
        title="Sélectionner un patient"
        items={patients}
        onSelect={setSelectedPatient}
        onClose={() => setShowPatientPicker(false)}
        labelFn={(p) => `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || p.id}
      />
      <PickerModal
        visible={showChambrePicker}
        title="Sélectionner une chambre"
        items={chambres}
        onSelect={setSelectedChambre}
        onClose={() => setShowChambrePicker(false)}
        labelFn={(c) => `Chambre ${c.numero ?? c.id}${c.service ? ` — ${c.service}` : ''}`}
      />
      <PickerModal
        visible={showMedPicker}
        title="Choisir un médicament"
        items={medicaments}
        onSelect={setSelectedMed}
        onClose={() => setShowMedPicker(false)}
        labelFn={(m) => m.nom ?? m.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.lg, paddingBottom: 100 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textSecondary, marginBottom: spacing.xs },
  labelSm: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: 4 },
  selector: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectorText: { fontSize: fontSize.base, color: LUNA_COLORS.text },
  placeholder: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.text,
    marginBottom: spacing.sm,
  },
  area: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  addBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addBtnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  itemsBox: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.border ?? '#e5e7eb' },
  itemNom: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.text },
  itemMeta: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  removeBtn: { color: LUNA_COLORS.error, fontSize: fontSize.lg, paddingHorizontal: spacing.sm },
  submitBtn: {
    backgroundColor: LUNA_COLORS.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: LUNA_COLORS.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '80%' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.text, marginBottom: spacing.md },
  search: { backgroundColor: LUNA_COLORS.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, padding: spacing.sm, marginBottom: spacing.sm, fontSize: fontSize.sm, color: LUNA_COLORS.text },
  item: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.border ?? '#e5e7eb' },
  itemText: { fontSize: fontSize.base, color: LUNA_COLORS.text },
  cancelBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.md },
  cancelText: { color: LUNA_COLORS.error, fontWeight: fontWeight.bold },
});
