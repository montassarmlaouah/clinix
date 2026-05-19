import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch, apiPost, apiPut } from '@/src/api/client';
import { IMAGERIES, RAPPORTS } from '@/src/api/endpoints';
import { LoadingOverlay } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Imagerie {
  id: string;
  type: string;
  typeExamen?: string;
  patient?: { id: string; nom: string; prenom: string };
}

interface Rapport {
  id: string;
  technique?: string;
  resultat?: string;
  conclusion?: string;
  recommandation?: string;
  lienImages?: string;
  signe?: boolean;
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function RapportFormScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);

  const [imagerie, setImagerie] = useState<Imagerie | null>(null);
  const [existingRapport, setExistingRapport] = useState<Rapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  const [technique, setTechnique] = useState('');
  const [resultat, setResultat] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommandation, setRecommandation] = useState('');
  const [lienImages, setLienImages] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const img = await apiGet<Imagerie>(IMAGERIES.BY_ID(id));
        setImagerie(img);
        try {
          const rap = await apiGet<Rapport>(RAPPORTS.BY_IMAGERIE(id));
          setExistingRapport(rap);
          setTechnique(rap.technique ?? '');
          setResultat(rap.resultat ?? '');
          setConclusion(rap.conclusion ?? '');
          setRecommandation(rap.recommandation ?? '');
          setLienImages(rap.lienImages ?? '');
        } catch {
          /* no existing rapport */
        }
      } catch {
        Alert.alert('Erreur', 'Impossible de charger l\'examen.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!technique.trim() || technique.trim().length < 5)
      e.technique = 'Technique requise (min 5 caractères).';
    if (!resultat.trim() || resultat.trim().length < 10)
      e.resultat = 'Résultat requis (min 10 caractères).';
    if (!conclusion.trim() || conclusion.trim().length < 5)
      e.conclusion = 'Conclusion requise (min 5 caractères).';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSaveDraft() {
    if (!validate()) return;
    await doSave(false);
  }

  async function handleSignAndSend() {
    if (!validate()) return;
    await doSave(true);
  }

  async function doSave(sign: boolean) {
    if (!id || !userId) return;
    setSaving(true);
    try {
      let rapportId = existingRapport?.id;

      if (rapportId && !existingRapport?.signe) {
        await apiPut(RAPPORTS.GET(rapportId), {
          technique: technique.trim(),
          resultat: resultat.trim(),
          conclusion: conclusion.trim(),
          recommandation: recommandation.trim() || undefined,
          lienImages: lienImages.trim() || undefined,
        });
      } else if (!rapportId) {
        const created = await apiPost<{ id: string }>(RAPPORTS.CREATE, {
          imagerieId: id,
          radiologueId: userId,
          technique: technique.trim(),
          resultat: resultat.trim(),
          conclusion: conclusion.trim(),
          recommandation: recommandation.trim() || undefined,
          lienImages: lienImages.trim() || undefined,
        });
        rapportId = created.id;
      }

      if (sign && rapportId) {
        setSigning(true);
        await apiPatch(RAPPORTS.VALIDER(rapportId) + `?radiologueId=${userId}`);
        Alert.alert('Rapport signé', 'Le médecin a été notifié.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Brouillon sauvegardé', 'Le rapport a été enregistré.', [
          { text: 'OK' },
        ]);
      }
    } catch (err: unknown) {
      Alert.alert('Erreur', (err as { message?: string })?.message ?? 'Impossible d\'enregistrer le rapport.');
    } finally {
      setSaving(false);
      setSigning(false);
    }
  }

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={LUNA_COLORS.dark} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {imagerie?.typeExamen ?? imagerie?.type ?? 'Rapport'}
          </Text>
          {imagerie?.patient && (
            <Text style={styles.headerSub}>{imagerie.patient.prenom} {imagerie.patient.nom}</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Technique */}
          <Text style={styles.label}>Technique *</Text>
          <TextInput
            value={technique}
            onChangeText={(v) => { setTechnique(v); setErrors((e) => ({ ...e, technique: '' })); }}
            style={[styles.textarea, !!errors.technique && styles.inputError]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Ex: IRM cérébrale sans/avec injection..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          {errors.technique ? <Text style={styles.errTxt}>{errors.technique}</Text> : null}

          {/* Résultat */}
          <Text style={styles.label}>Résultat *</Text>
          <TextInput
            value={resultat}
            onChangeText={(v) => { setResultat(v); setErrors((e) => ({ ...e, resultat: '' })); }}
            style={[styles.textareaLarge, !!errors.resultat && styles.inputError]}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            placeholder="Description des constatations..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          {errors.resultat ? <Text style={styles.errTxt}>{errors.resultat}</Text> : null}

          {/* Conclusion */}
          <Text style={styles.label}>Conclusion *</Text>
          <TextInput
            value={conclusion}
            onChangeText={(v) => { setConclusion(v); setErrors((e) => ({ ...e, conclusion: '' })); }}
            style={[styles.textarea, !!errors.conclusion && styles.inputError]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Conclusion diagnostique..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          {errors.conclusion ? <Text style={styles.errTxt}>{errors.conclusion}</Text> : null}

          {/* Recommandation */}
          <Text style={styles.label}>Recommandation</Text>
          <TextInput
            value={recommandation}
            onChangeText={setRecommandation}
            style={styles.textarea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Examens complémentaires suggérés..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />

          {/* Lien images */}
          <Text style={styles.label}>URL PACS / Images</Text>
          <TextInput
            value={lienImages}
            onChangeText={setLienImages}
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={LUNA_COLORS.textDisabled}
            autoCapitalize="none"
            keyboardType="url"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={handleSaveDraft} disabled={saving} style={[styles.draftBtn, saving && styles.disabled]}>
          <Text style={styles.draftTxt}>{saving && !signing ? '…' : 'Sauvegarder (brouillon)'}</Text>
        </Pressable>
        <Pressable onPress={handleSignAndSend} disabled={saving} style={[styles.validateBtn, saving && styles.disabled, { ...(shadows.button as object) }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={LUNA_COLORS.textInverse} />
          <Text style={styles.validateTxt}>{signing ? 'Signature…' : 'Signer et envoyer'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  headerSub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  // ✨ ScrollView — paddingBottom tab bar
  form: { padding: spacing.xxl, paddingBottom: 80 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark, marginBottom: spacing.xs, marginTop: spacing.md },
  // ✨ Input HeroUI — inputBg
  textarea: { backgroundColor: LUNA_COLORS.inputBg, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, minHeight: 100, marginBottom: spacing.sm },
  textareaLarge: { backgroundColor: LUNA_COLORS.inputBg, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, minHeight: 200, marginBottom: spacing.sm },
  input: { backgroundColor: LUNA_COLORS.inputBg, borderWidth: 1, borderColor: LUNA_COLORS.borderInput, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, marginBottom: spacing.sm, minHeight: 52 },
  inputError: { borderColor: LUNA_COLORS.error },
  errTxt: { fontSize: fontSize.xs, color: LUNA_COLORS.error, marginTop: -spacing.sm, marginBottom: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, borderTopWidth: 1, borderTopColor: 'rgba(197, 220, 234, 0.6)' },
  draftBtn: { flex: 1, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: LUNA_COLORS.secondary },
  draftTxt: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.secondary },
  validateBtn: { flex: 2, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs, backgroundColor: LUNA_COLORS.secondary },
  validateTxt: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  disabled: { opacity: 0.6 },
});
