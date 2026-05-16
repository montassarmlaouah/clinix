import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/src/components/common';
import { apiGet, apiPatch, apiPost, apiUpload } from '@/src/api/client';
import { IMAGERIES, RAPPORTS, UPLOAD } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Imagerie {
  id:                   number;
  typeExamen:           string;
  dateCreation:         string;
  urgent?:              boolean;
  statut?:              string;
  patient?:             { id: number; nom: string; prenom: string };
  medecinPrescripteur?: { nom: string; prenom: string };
}

interface PieceJointe {
  uri:  string;  // local URI for preview
  url?: string;  // uploaded URL
  type: 'image' | 'pdf';
  name: string;
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function RapportScreen(): React.JSX.Element {
  const router     = useRouter();
  const { imagerieId } = useLocalSearchParams<{ imagerieId: string }>();
  const userId     = useAuthStore((s) => s.userId);

  const [imagerie,       setImagerie]       = useState<Imagerie | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [interpretation, setInterpretation] = useState('');
  const [conclusion,     setConclusion]     = useState('');
  const [pieces,         setPieces]         = useState<PieceJointe[]>([]);
  const [uploading,      setUploading]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [mediaModal,     setMediaModal]     = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  useEffect(() => {
    if (!imagerieId) return;
    apiGet<Imagerie>(IMAGERIES.BY_ID(imagerieId))
      .then(setImagerie)
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false));
  }, [imagerieId]);

  // ── Upload helpers ──────────────────────────────────────────────────────────
  async function uploadFile(uri: string, name: string, mime: string, type: 'image' | 'pdf') {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri, name, type: mime } as unknown as Blob);
      const { url } = await apiUpload<{ url: string }>(UPLOAD, fd);
      setPieces((prev) => [...prev, { uri, url, type, name }]);
    } catch {
      Alert.alert('Erreur', 'Impossible de téléverser le fichier.');
    } finally {
      setUploading(false);
    }
  }

  async function pickFromGallery() {
    setMediaModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(
        asset.uri,
        asset.fileName ?? `image_${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg',
        'image',
      );
    }
  }

  async function pickFromCamera() {
    setMediaModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à la caméra nécessaire.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(
        asset.uri,
        asset.fileName ?? `photo_${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg',
        'image',
      );
    }
  }

  async function pickPDF() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, 'application/pdf', 'pdf');
    }
  }

  function removePiece(index: number) {
    setPieces((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!interpretation.trim() || interpretation.trim().length < 10)
      e.interpretation = 'Interprétation requise (min 10 caractères).';
    if (!conclusion.trim() || conclusion.trim().length < 5)
      e.conclusion = 'Conclusion requise (min 5 caractères).';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Soumettre ───────────────────────────────────────────────────────────────
  async function handleSave(validate_: boolean) {
    if (!validate()) return;
    setSaving(true);
    try {
      const imageUrls = pieces.filter((p) => p.url).map((p) => p.url as string);
      const rapport = await apiPost<{ id: number }>(RAPPORTS.CREATE, {
        imagerieId: Number(imagerieId),
        radiologueId: userId,
        interpretation: interpretation.trim(),
        conclusion:     conclusion.trim(),
        imageUrls,
      });
      if (validate_ && rapport?.id) {
        await apiPatch(RAPPORTS.VALIDER(rapport.id));
      }
      Alert.alert(
        validate_ ? 'Rapport validé' : 'Brouillon enregistré',
        validate_
          ? 'Le rapport a été signé et envoyé.'
          : 'Le brouillon a été sauvegardé.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le rapport.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* En-tête */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.dark} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {imagerie?.typeExamen ?? 'Rapport d\'imagerie'}
          </Text>
          {imagerie?.patient ? (
            <Text style={styles.headerSub}>
              {imagerie.patient.prenom} {imagerie.patient.nom}
            </Text>
          ) : null}
        </View>
        {imagerie?.urgent ? (
          <View style={styles.urgBadge}>
            <Text style={styles.urgTxt}>Urgent</Text>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Interprétation */}
          <Text style={styles.label}>Interprétation *</Text>
          <TextInput
            value={interpretation}
            onChangeText={(v) => { setInterpretation(v); setErrors((e) => ({ ...e, interpretation: '' })); }}
            style={[styles.textarea, !!errors.interpretation && styles.inputError]}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholder="Décrivez les observations radiologiques..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          {errors.interpretation ? <Text style={styles.errTxt}>{errors.interpretation}</Text> : null}

          {/* Conclusion */}
          <Text style={styles.label}>Conclusion *</Text>
          <TextInput
            value={conclusion}
            onChangeText={(v) => { setConclusion(v); setErrors((e) => ({ ...e, conclusion: '' })); }}
            style={[styles.textarea, !!errors.conclusion && styles.inputError]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Conclusion diagnostique..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          {errors.conclusion ? <Text style={styles.errTxt}>{errors.conclusion}</Text> : null}

          {/* Pièces jointes */}
          <Text style={styles.sectionTitle}>Pièces jointes</Text>
          <View style={styles.uploadBtns}>
            <Pressable
              onPress={() => setMediaModal(true)}
              disabled={uploading}
              style={[styles.uploadBtn, { borderColor: LUNA_COLORS.secondary }]}
            >
              <Ionicons name="image-outline" size={18} color={LUNA_COLORS.secondary} />
              <Text style={[styles.uploadBtnTxt, { color: LUNA_COLORS.secondary }]}>
                {uploading ? 'Envoi…' : 'Image'}
              </Text>
            </Pressable>
            <Pressable
              onPress={pickPDF}
              disabled={uploading}
              style={[styles.uploadBtn, { borderColor: LUNA_COLORS.error }]}
            >
              <Ionicons name="document-outline" size={18} color={LUNA_COLORS.error} />
              <Text style={[styles.uploadBtnTxt, { color: LUNA_COLORS.error }]}>PDF</Text>
            </Pressable>
          </View>

          {/* Aperçu horizontal */}
          {pieces.length > 0 ? (
            <FlatList
              data={pieces}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => String(idx)}
              contentContainerStyle={styles.previewList}
              renderItem={({ item, index }) => (
                <View style={styles.previewItem}>
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.uri }} style={styles.previewImg} />
                  ) : (
                    <View style={[styles.previewImg, styles.pdfThumb]}>
                      <Ionicons name="document-text" size={28} color={LUNA_COLORS.error} />
                    </View>
                  )}
                  <Pressable
                    onPress={() => removePiece(index)}
                    style={styles.removeBtn}
                    hitSlop={4}
                  >
                    <Ionicons name="close" size={12} color={LUNA_COLORS.textInverse} />
                  </Pressable>
                  <Text style={styles.previewName} numberOfLines={1}>{item.name}</Text>
                </View>
              )}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer fixe */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => handleSave(false)}
          disabled={saving}
          style={[styles.draftBtn, saving && styles.disabled]}
        >
          <Text style={styles.draftTxt}>{saving ? '…' : 'Brouillon'}</Text>
        </Pressable>
        <Pressable
          onPress={() => handleSave(true)}
          disabled={saving}
          style={[styles.validateBtn, saving && styles.disabled, { ...(shadows.button as object) }]}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color={LUNA_COLORS.textInverse} />
          <Text style={styles.validateTxt}>{saving ? '…' : 'Valider et signer'}</Text>
        </Pressable>
      </View>

      {/* Modal choix image */}
      <Modal visible={mediaModal} transparent animationType="slide" onRequestClose={() => setMediaModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMediaModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Ajouter une image</Text>
          <Pressable onPress={pickFromGallery} style={styles.modalRow}>
            <Ionicons name="images-outline" size={20} color={LUNA_COLORS.dark} />
            <Text style={styles.modalRowTxt}>Galerie</Text>
          </Pressable>
          <Pressable onPress={pickFromCamera} style={styles.modalRow}>
            <Ionicons name="camera-outline" size={20} color={LUNA_COLORS.dark} />
            <Text style={styles.modalRowTxt}>Caméra</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: LUNA_COLORS.background },
  header:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle:{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  headerSub:  { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  urgBadge: { backgroundColor: LUNA_COLORS.errorLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  urgTxt:   { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: LUNA_COLORS.error },

  form:         { padding: spacing.xxl, paddingBottom: 20 },
  label:        { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginBottom: spacing.xs },
  textarea:     { backgroundColor: LUNA_COLORS.surface, borderWidth: 1, borderColor: LUNA_COLORS.borderDark, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, minHeight: 120, marginBottom: spacing.md },
  inputError:   { borderColor: LUNA_COLORS.error },
  errTxt:       { fontSize: fontSize.xs, color: LUNA_COLORS.error, marginTop: -spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.md, marginTop: spacing.sm },

  uploadBtns:   { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  uploadBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: 44, borderRadius: borderRadius.md, borderWidth: 1.5, backgroundColor: LUNA_COLORS.surface },
  uploadBtnTxt: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  previewList: { gap: spacing.sm, paddingBottom: spacing.sm },
  previewItem: { width: 80, alignItems: 'center' },
  previewImg:  { width: 80, height: 80, borderRadius: borderRadius.sm, backgroundColor: LUNA_COLORS.surfaceLight },
  pdfThumb:    { alignItems: 'center', justifyContent: 'center' },
  removeBtn:   { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: LUNA_COLORS.error, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 10, color: LUNA_COLORS.textSecondary, marginTop: 3, width: 76, textAlign: 'center' },

  footer:      { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, borderTopWidth: 1, borderTopColor: LUNA_COLORS.borderDark },
  draftBtn:    { flex: 1, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: LUNA_COLORS.secondary },
  draftTxt:    { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.secondary },
  validateBtn: { flex: 2, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs, backgroundColor: LUNA_COLORS.secondary },
  validateTxt: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  disabled:    { opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: LUNA_COLORS.overlay },
  modalSheet:   { backgroundColor: LUNA_COLORS.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: LUNA_COLORS.borderDark, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  modalTitle:   { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.md },
  modalRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderDark },
  modalRowTxt:  { fontSize: fontSize.base, color: LUNA_COLORS.dark },
});
