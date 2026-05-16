import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPatch } from '@/src/api/client';
import { RAPPORTS } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Rapport {
  id: string;
  technique?: string;
  resultat?: string;
  conclusion?: string;
  recommandation?: string;
  signe?: boolean;
  lienImages?: string;
  commentaireMedecin?: string;
  validateParMedecin?: boolean;
  date?: string;
  radiologue?: { prenom: string; nom: string };
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function MedecinRapportScreen(): React.JSX.Element {
  const router = useRouter();
  const { rapportId: examenId } = useLocalSearchParams<{ rapportId: string }>();

  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentaire, setCommentaire] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!examenId) return;
    (async () => {
      try {
        const rap = await apiGet<Rapport>(RAPPORTS.BY_IMAGERIE(examenId));
        setRapport(rap);
        setCommentaire(rap.commentaireMedecin ?? '');
      } catch {
        Alert.alert('Erreur', 'Impossible de charger le rapport.');
      } finally {
        setLoading(false);
      }
    })();
  }, [examenId]);

  const handleValider = async () => {
    if (!rapport?.id) return;
    setValidating(true);
    try {
      await apiPatch(RAPPORTS.COMMENTER(rapport.id), {
        commentaireMedecin: commentaire.trim(),
        validateParMedecin: true,
      });
      Alert.alert('Succès', 'Rapport validé et intégré au dossier.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de valider le rapport.');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!rapport) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={LUNA_COLORS.textSecondary} />
          <Text style={styles.emptyText}>Rapport non disponible</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
        </Pressable>
        <Text style={styles.navTitle}>Rapport d'imagerie</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {rapport.signe && (
            <View style={styles.signedBanner}>
              <Ionicons name="shield-checkmark" size={16} color={LUNA_COLORS.success} />
              <Text style={styles.signedBannerText}>Rapport signé par le radiologue</Text>
            </View>
          )}

          {rapport.technique && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Technique</Text>
              <Text style={styles.textBody}>{rapport.technique}</Text>
            </View>
          )}

          {rapport.resultat && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Résultat</Text>
              <Text style={styles.textBody}>{rapport.resultat}</Text>
            </View>
          )}

          {rapport.conclusion && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Conclusion</Text>
              <Text style={styles.textBody}>{rapport.conclusion}</Text>
            </View>
          )}

          {rapport.recommandation && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recommandation</Text>
              <Text style={styles.textBody}>{rapport.recommandation}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Validation et commentaire</Text>
            <TextInput
              value={commentaire}
              onChangeText={setCommentaire}
              style={styles.textarea}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Ajouter un commentaire ou une remarque..."
              placeholderTextColor={LUNA_COLORS.textDisabled}
            />
            <Pressable
              style={[styles.validateBtn, validating && { opacity: 0.6 }]}
              onPress={handleValider}
              disabled={validating}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={LUNA_COLORS.textInverse} />
              <Text style={styles.validateBtnText}>
                {validating ? 'Validation…' : 'Valider et intégrer au dossier'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  emptyText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  scroll: { padding: spacing.xxl, paddingBottom: 80 },
  signedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.successLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  signedBannerText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.success },
  card: { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.xxl, marginBottom: spacing.lg, ...(shadows.sm as object) },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.secondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md },
  textBody: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, lineHeight: 22 },
  textarea: { backgroundColor: LUNA_COLORS.background, borderWidth: 1, borderColor: LUNA_COLORS.borderDark, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, minHeight: 100, marginBottom: spacing.md },
  validateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: LUNA_COLORS.success, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  validateBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
});
