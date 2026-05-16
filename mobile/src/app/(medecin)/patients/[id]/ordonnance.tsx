import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/src/components/common';
import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { ORDONNANCES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'creer' | 'historique';

interface OrdonnanceInfo {
  id:          string;
  numero:      string;
  dateCreation: string;
  signe:       boolean;
  medicaments: { nom: string; dosage: string; duree: string; instructions?: string }[];
  pdfUrl?:     string;
}

interface Medicament {
  nom:          string;
  dosage:       string;
  duree:        string;
  instructions: string;
}

type MedField = keyof Medicament;

// ── Ligne médicament ──────────────────────────────────────────────────────────
function MedicamentRow({
  med,
  index,
  onChange,
  onRemove,
}: {
  med:      Medicament;
  index:    number;
  onChange: (index: number, field: MedField, value: string) => void;
  onRemove: (index: number) => void;
}): React.JSX.Element {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.titleRow}>
        <Text style={rowStyles.num}>Médicament {index + 1}</Text>
        <Pressable onPress={() => onRemove(index)} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={LUNA_COLORS.error} />
        </Pressable>
      </View>

      <FieldInput
        label="Nom du médicament *"
        value={med.nom}
        onChangeText={(v) => onChange(index, 'nom', v)}
        placeholder="Ex : Amoxicilline 500mg"
      />
      <FieldInput
        label="Dosage *"
        value={med.dosage}
        onChangeText={(v) => onChange(index, 'dosage', v)}
        placeholder="Ex : 1 comprimé 3×/jour"
      />
      <FieldInput
        label="Durée *"
        value={med.duree}
        onChangeText={(v) => onChange(index, 'duree', v)}
        placeholder="Ex : 7 jours"
      />
      <FieldInput
        label="Instructions"
        value={med.instructions}
        onChangeText={(v) => onChange(index, 'instructions', v)}
        placeholder="Ex : À prendre pendant les repas"
      />
    </View>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label:         string;
  value:         string;
  onChangeText:  (v: string) => void;
  placeholder?:  string;
}) {
  return (
    <View style={rowStyles.fieldWrap}>
      <Text style={rowStyles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={LUNA_COLORS.textDisabled}
        style={rowStyles.fieldInput}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.md,
    padding:           spacing.lg,
    marginBottom:      spacing.md,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderDark,
    ...(shadows.sm as object),
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   spacing.md,
  },
  num: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.secondary },
  fieldWrap:   { marginBottom: spacing.sm },
  fieldLabel:  { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: spacing.xs },
  fieldInput: {
    backgroundColor:   LUNA_COLORS.surfaceLight,
    borderRadius:      borderRadius.xs,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    fontSize:          fontSize.sm,
    color:             LUNA_COLORS.textPrimary,
  },
});

// ── Écran Ordonnance ──────────────────────────────────────────────────────────
const EMPTY_MED: Medicament = { nom: '', dosage: '', duree: '', instructions: '' };

export default function OrdonnanceScreen(): React.JSX.Element {
  const router    = useRouter();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const medecinId = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [medicaments, setMedicaments] = useState<Medicament[]>([{ ...EMPTY_MED }]);
  const [loading,     setLoading]     = useState(false);
  const [pdfUrl,      setPdfUrl]      = useState<string | null>(null);

  // ── Mode historique ───────────────────────────────────────────────────────────────────────────────
  const [mode,        setMode]        = useState<Mode>('creer');
  const [ordonnances, setOrdonnances] = useState<OrdonnanceInfo[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [signingId,   setSigningId]   = useState<string | null>(null);

  const loadOrdonnances = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await apiGet<OrdonnanceInfo[]>(ORDONNANCES.BY_PATIENT(id!));
      setOrdonnances(data);
    } catch { /* ignore */ }
    finally { setHistLoading(false); }
  }, [id]);

  useEffect(() => {
    if (mode === 'historique') loadOrdonnances();
  }, [mode, loadOrdonnances]);

  async function handleSigner(ordId: string) {
    setSigningId(ordId);
    try {
      await apiPatch(ORDONNANCES.SIGNER(ordId), {});
      setOrdonnances((prev) =>
        prev.map((o) => (o.id === ordId ? { ...o, signee: true } : o))
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de signer l\'ordonnance. Veuillez réessayer.');
    } finally {
      setSigningId(null);
    }
  }

  function addMedicament() {
    setMedicaments((prev) => [...prev, { ...EMPTY_MED }]);
  }

  function removeMedicament(index: number) {
    if (medicaments.length === 1) {
      Alert.alert('Impossible', 'L\'ordonnance doit contenir au moins un médicament.');
      return;
    }
    setMedicaments((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMedicament(index: number, field: MedField, value: string) {
    setMedicaments((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function validate(): boolean {
    for (let i = 0; i < medicaments.length; i++) {
      const m = medicaments[i];
      if (!m.nom.trim()) {
        Alert.alert('Champ requis', `Médicament ${i + 1} : le nom est obligatoire.`);
        return false;
      }
      if (!m.dosage.trim()) {
        Alert.alert('Champ requis', `Médicament ${i + 1} : le dosage est obligatoire.`);
        return false;
      }
      if (!m.duree.trim()) {
        Alert.alert('Champ requis', `Médicament ${i + 1} : la durée est obligatoire.`);
        return false;
      }
    }
    return true;
  }

  async function handleCreate() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await apiPost<{ id: string }>(ORDONNANCES.CREATE, {
        patientId:   id!,
        medecinId:   medecinId!,
        medicaments: medicaments.map((m) => ({
          nom:          m.nom.trim(),
          dosage:       m.dosage.trim(),
          duree:        m.duree.trim(),
          instructions: m.instructions.trim() || undefined,
        })),
        organisationId: cliniqueId ?? undefined,
      });

      // Récupérer l'URL du PDF
      try {
        const pdfData = await apiGet<{ url: string }>(ORDONNANCES.PDF(result.id));
        setPdfUrl(pdfData.url);
      } catch {
        // PDF non disponible immédiatement
        Alert.alert('Ordonnance créée', 'L\'ordonnance a été créée. Le PDF sera bientôt disponible.');
        router.back();
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de créer l\'ordonnance. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenPdf() {
    if (!pdfUrl) return;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF.');
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ouverture du PDF.');
    }
  }

  // ── Écran succès ─────────────────────────────────────────────────────────────
  if (pdfUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={successStyles.container}>
          <Ionicons name="checkmark-circle" size={72} color={LUNA_COLORS.success} />
          <Text style={successStyles.title}>Ordonnance créée</Text>
          <Text style={successStyles.sub}>
            L'ordonnance a été générée avec succès.
          </Text>
          <View style={successStyles.actions}>
            <Button
              title="Voir le PDF"
              size="lg"
              fullWidth
              onPress={handleOpenPdf}
            />
            <Button
              title="Retour au dossier"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.navTitle}>Ordonnance</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Onglets Créer / Historique */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'creer' && styles.tabActive]}
          onPress={() => setMode('creer')}
        >
          <Text style={[styles.tabText, mode === 'creer' && styles.tabTextActive]}>
            Créer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'historique' && styles.tabActive]}
          onPress={() => setMode('historique')}
        >
          <Text style={[styles.tabText, mode === 'historique' && styles.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu selon le mode */}
      {mode === 'creer' ? (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              {medicaments.length} médicament{medicaments.length > 1 ? 's' : ''} ajouté{medicaments.length > 1 ? 's' : ''}
            </Text>

            {medicaments.map((med, i) => (
              <MedicamentRow
                key={i}
                med={med}
                index={i}
                onChange={updateMedicament}
                onRemove={removeMedicament}
              />
            ))}

            {/* Bouton ajouter */}
            <Pressable style={styles.addBtn} onPress={addMedicament}>
              <Ionicons name="add" size={18} color={LUNA_COLORS.secondary} />
              <Text style={styles.addBtnTxt}>Ajouter un médicament</Text>
            </Pressable>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Créer l'ordonnance"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleCreate}
            />
          </View>
        </>
      ) : (
        /* ── Historique ── */
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {histLoading ? (
            <ActivityIndicator size="large" color={LUNA_COLORS.secondary} style={{ marginTop: 40 }} />
          ) : ordonnances.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={48} color={LUNA_COLORS.textDisabled} />
              <Text style={styles.emptyTxt}>Aucune ordonnance pour ce patient</Text>
            </View>
          ) : (
            ordonnances.map((ord) => (
              <View key={ord.id} style={styles.ordCard}>
                <View style={styles.ordHeader}>
                  <Text style={styles.ordNum}>{ord.numero ?? 'Ordonnance'}</Text>
                  <View style={[styles.ordBadge, ord.signe ? styles.ordBadgeSigned : styles.ordBadgeUnsigned]}>
                    <Text style={[styles.ordBadgeText, ord.signe ? styles.ordBadgeSignedText : styles.ordBadgeUnsignedText]}>
                      {ord.signe ? '✓ Signée' : 'Non signée'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ordDate}>
                  {new Date(ord.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                {ord.medicaments?.length > 0 && (
                  <Text style={styles.ordMeds}>
                    {ord.medicaments.length} médicament{ord.medicaments.length > 1 ? 's' : ''}
                  </Text>
                )}
                {!ord.signe && (
                  <TouchableOpacity
                    style={[styles.signerBtn, signingId === ord.id && styles.signerBtnDisabled]}
                    onPress={() => handleSigner(ord.id)}
                    disabled={signingId !== null}
                    accessibilityRole="button"
                  >
                    {signingId === ord.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="pencil" size={16} color="#fff" />
                        <Text style={styles.signerBtnText}>Signer l'ordonnance</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const successStyles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.xxxl,
    backgroundColor: LUNA_COLORS.background,
  },
  title: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.darkest,
    marginTop:  spacing.xl,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize:     fontSize.base,
    color:        LUNA_COLORS.textSecondary,
    textAlign:    'center',
    marginBottom: spacing.xxxl,
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
  navTitle: {
    flex:       1,
    textAlign:  'center',
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
  },
  scroll: { padding: spacing.xxl, paddingBottom: 120 },
  intro: {
    fontSize:     fontSize.sm,
    color:        LUNA_COLORS.textSecondary,
    marginBottom: spacing.lg,
  },
  addBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm,
    paddingVertical: spacing.md,
    borderWidth:    1.5,
    borderStyle:    'dashed',
    borderColor:    LUNA_COLORS.secondary,
    borderRadius:   borderRadius.md,
    marginTop:      spacing.sm,
  },
  addBtnTxt: {
    fontSize:   fontSize.base,
    color:      LUNA_COLORS.secondary,
    fontWeight: fontWeight.medium,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    borderTopWidth:    1,
    borderTopColor:    LUNA_COLORS.border,
  },
  // ── Tabs ──
  tabs: {
    flexDirection:     'row',
    marginHorizontal:  spacing.xxl,
    marginVertical:    spacing.md,
    backgroundColor:   LUNA_COLORS.surfaceLight,
    borderRadius:      borderRadius.sm,
    padding:           2,
  },
  tab: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: spacing.sm,
    borderRadius:    borderRadius.xs,
  },
  tabActive:     { backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  tabText:       { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  tabTextActive: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  // ── Historique ──
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyTxt:  { color: LUNA_COLORS.textDisabled, fontSize: fontSize.sm },
  ordCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    padding:         spacing.lg,
    marginBottom:    spacing.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.border,
    gap:             spacing.xs,
    ...(shadows.sm as object),
  },
  ordHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ordNum:              { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, flex: 1 },
  ordBadge:            { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.xs },
  ordBadgeSigned:      { backgroundColor: LUNA_COLORS.success + '22' },
  ordBadgeUnsigned:    { backgroundColor: LUNA_COLORS.warning + '22' },
  ordBadgeText:        { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  ordBadgeSignedText:  { color: LUNA_COLORS.success },
  ordBadgeUnsignedText: { color: LUNA_COLORS.warning },
  ordDate:             { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  ordMeds:             { fontSize: fontSize.xs, color: LUNA_COLORS.textDisabled },
  signerBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    marginTop:       spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius:    borderRadius.sm,
    backgroundColor: LUNA_COLORS.secondary,
  },
  signerBtnDisabled: { opacity: 0.6 },
  signerBtnText:     { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
