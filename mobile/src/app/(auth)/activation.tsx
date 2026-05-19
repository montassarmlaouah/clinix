import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '@/src/api/client';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface VerifTelephoneResponse {
  telephone:       string;
  existe:          boolean;
  role?:           string;
  actif?:          boolean;
  compteEnAttente?: boolean;
  peutInscrire?:   boolean;
  message:         string;
}

type VerifState = 'idle' | 'loading' | 'found_pending' | 'found_active' | 'not_found' | 'error';

// ── Écran Activation de compte ────────────────────────────────────────────────
export default function ActivationScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ telephone?: string }>();

  const [telephone, setTelephone] = useState(params.telephone ?? '');
  const [verifState, setVerifState] = useState<VerifState>('idle');
  const [verifData, setVerifData]   = useState<VerifTelephoneResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // Auto-vérification si téléphone passé en paramètre
  useEffect(() => {
    if (params.telephone) {
      handleVerifier();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifier = useCallback(async () => {
    const tel = telephone.trim();
    if (!tel) {
      setError('Veuillez saisir votre numéro de téléphone.');
      return;
    }
    setError(null);
    setVerifState('loading');
    try {
      const data = await apiFetch<VerifTelephoneResponse>(
        `/auth/verifier-telephone/${encodeURIComponent(tel)}`,
      );
      setVerifData(data);
      if (!data.existe) {
        setVerifState('not_found');
      } else if (data.compteEnAttente) {
        setVerifState('found_pending');
      } else if (data.actif) {
        setVerifState('found_active');
      } else {
        setVerifState('not_found');
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Erreur réseau.';
      setError(msg);
      setVerifState('error');
    }
  }, [telephone]);

  const goToLogin = () => {
    router.replace({
      pathname: '/(auth)/login',
      params: telephone ? { telephone } : {},
    });
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderStatusCard = () => {
    if (verifState === 'idle') return null;
    if (verifState === 'loading') {
      return (
        <View style={[styles.statusCard, styles.infoCard]}>
          <ActivityIndicator size="small" color={LUNA_COLORS.secondary} />
          <Text style={styles.statusText}>Vérification en cours…</Text>
        </View>
      );
    }
    if (verifState === 'found_pending') {
      return (
        <View style={[styles.statusCard, styles.successCard]}>
          <Ionicons name="checkmark-circle" size={32} color={LUNA_COLORS.success} />
          <View style={styles.statusBody}>
            <Text style={styles.statusTitle}>Compte prêt !</Text>
            <Text style={styles.statusMsg}>
              Votre compte <Text style={styles.bold}>{verifData?.role}</Text> est prêt.
              {'\n'}Connectez-vous avec le mot de passe reçu par SMS.
            </Text>
          </View>
        </View>
      );
    }
    if (verifState === 'found_active') {
      return (
        <View style={[styles.statusCard, styles.infoCard]}>
          <Ionicons name="information-circle" size={32} color={LUNA_COLORS.secondary} />
          <View style={styles.statusBody}>
            <Text style={styles.statusTitle}>Compte déjà actif</Text>
            <Text style={styles.statusMsg}>
              Ce numéro est déjà actif en tant que{' '}
              <Text style={styles.bold}>{verifData?.role}</Text>.
              {'\n'}Rendez-vous directement à la connexion.
            </Text>
          </View>
        </View>
      );
    }
    if (verifState === 'not_found') {
      return (
        <View style={[styles.statusCard, styles.warningCard]}>
          <Ionicons name="alert-circle-outline" size={32} color={LUNA_COLORS.warning} />
          <View style={styles.statusBody}>
            <Text style={styles.statusTitle}>Numéro introuvable</Text>
            <Text style={styles.statusMsg}>
              Aucun compte n'est associé à ce numéro. Vérifiez votre numéro ou contactez un administrateur.
            </Text>
          </View>
        </View>
      );
    }
    if (verifState === 'error') {
      return (
        <View style={[styles.statusCard, styles.errorCard]}>
          <Ionicons name="warning-outline" size={32} color={LUNA_COLORS.error} />
          <View style={styles.statusBody}>
            <Text style={styles.statusTitle}>Erreur</Text>
            <Text style={styles.statusMsg}>{error}</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Icône hero ── */}
          <View style={styles.heroWrap}>
            <View style={styles.heroIcon}>
              <Ionicons name="checkmark-circle" size={64} color={LUNA_COLORS.success} />
            </View>
          </View>

          {/* ── Card principale ── */}
          <View style={styles.card}>
            <Text style={styles.title}>Activation de compte</Text>
            <Text style={styles.subtitle}>
              Vous avez reçu un SMS avec vos identifiants.{'\n'}
              Vérifiez votre numéro pour confirmer l'activation.
            </Text>

            {/* Input téléphone */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={LUNA_COLORS.tertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 21612345678"
                  placeholderTextColor={LUNA_COLORS.textDisabled}
                  keyboardType="phone-pad"
                  value={telephone}
                  onChangeText={setTelephone}
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleVerifier}
                />
              </View>
              {error && verifState === 'idle' && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>

            {/* Bouton vérifier */}
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
              onPress={handleVerifier}
              disabled={verifState === 'loading'}
            >
              {verifState === 'loading' ? (
                <ActivityIndicator color={LUNA_COLORS.surface} />
              ) : (
                <Text style={styles.btnPrimaryText}>Vérifier mon compte</Text>
              )}
            </Pressable>

            {/* Carte statut */}
            {renderStatusCard()}

            {/* CTA connexion */}
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }]}
              onPress={goToLogin}
            >
              <Ionicons name="log-in-outline" size={18} color={LUNA_COLORS.secondary} />
              <Text style={styles.btnSecondaryText}>J'ai reçu mon SMS, me connecter</Text>
            </Pressable>
          </View>

          {/* Lien retour */}
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={LUNA_COLORS.textSecondary} />
            <Text style={styles.backLinkText}>Retour</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LUNA_COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    paddingBottom: 80,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: LUNA_COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...shadows.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  inputWrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.dark,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.inputBg,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: LUNA_COLORS.darkest,
    height: '100%',
  },
  errorText: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.error,
    marginTop: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  btnPrimaryText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
    letterSpacing: 0.3,
  },
  // ── Status cards ──
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  infoCard: {
    backgroundColor: LUNA_COLORS.infoLight,
  },
  successCard: {
    backgroundColor: LUNA_COLORS.successLight,
  },
  warningCard: {
    backgroundColor: LUNA_COLORS.warningLight,
  },
  errorCard: {
    backgroundColor: LUNA_COLORS.errorLight,
  },
  statusBody: {
    flex: 1,
  },
  statusTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginBottom: 2,
  },
  statusMsg: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    lineHeight: 18,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  bold: {
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.dark,
  },
  divider: {
    height: 1,
    backgroundColor: LUNA_COLORS.borderSubtle,
    marginVertical: spacing.lg,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.md,
    height: 48,
    gap: spacing.xs,
  },
  btnSecondaryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.secondary,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  backLinkText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
  },
});
