import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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

import { apiPost } from '@/src/api/client';
import { AUTH_ENDPOINTS } from '@/src/api/endpoints';
import { Button, Card, Input } from '@/src/components/common';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

// ── Validation téléphone tunisien ─────────────────────────────────────────────
const TUNISIAN_PHONE_RE = /^(\+216)?[2459]\d{7}$/;
function isValidPhone(tel: string): boolean {
  return TUNISIAN_PHONE_RE.test(tel.replace(/\s/g, ''));
}

// ── Constantes ────────────────────────────────────────────────────────────────
const OTP_LENGTH   = 6;
const MIN_PW_LEN   = 8;
const STEP_LABELS  = ['Téléphone', 'Code OTP', 'Nouveau MDP'];
const STEP_COUNT   = 3;

type StepNumber = 1 | 2 | 3;

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();

  const [step,       setStep]       = useState<StepNumber>(1);
  const [telephone,  setTelephone]  = useState('');
  const [otp,        setOtp]        = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Refs pour les inputs OTP
  const otpRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function clearError(): void {
    if (error) setError(null);
  }

  function handleOtpChange(val: string, index: number): void {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number): void {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const next  = [...otp];
      next[index - 1] = '';
      setOtp(next);
    }
  }

  // ── Étape 1 : envoyer le code ────────────────────────────────────────────────
  async function handleSendCode(): Promise<void> {
    const tel = telephone.replace(/\s/g, '');
    if (!isValidPhone(tel)) {
      setError('Numéro invalide. Exemple : 55 123 456 ou +216 55 123 456');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await apiPost(AUTH_ENDPOINTS.FORGOT_SEND, { telephone: tel });
      setStep(2);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? 'Impossible d\'envoyer le code. Vérifiez le numéro.');
    } finally {
      setLoading(false);
    }
  }

  // ── Étape 2 : vérifier le code OTP ──────────────────────────────────────────
  async function handleVerifyCode(): Promise<void> {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Veuillez entrer les 6 chiffres du code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; resetToken?: string; message?: string }>(AUTH_ENDPOINTS.FORGOT_VERIFY, {
        telephone: telephone.replace(/\s/g, ''),
        code,
      });
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setStep(3);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? 'Code incorrect ou expiré. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  // ── Étape 3 : réinitialiser le mot de passe ──────────────────────────────────
  async function handleReset(): Promise<void> {
    if (nouveauMdp.length < MIN_PW_LEN) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PW_LEN} caractères.`);
      return;
    }
    if (nouveauMdp !== confirmMdp) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // ── Le backend attend : telephone, resetToken, newPassword ────────────
      await apiPost(AUTH_ENDPOINTS.FORGOT_RESET, {
        telephone:   telephone.replace(/\s/g, ''),
        resetToken:  resetToken || otp.join(''),
        newPassword: nouveauMdp,
      });
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? 'Échec de la réinitialisation. Veuillez recommencer.');
    } finally {
      setLoading(false);
    }
  }

  // ── Rendu de la barre de progression ────────────────────────────────────────
  function renderProgress(): React.JSX.Element {
    const pct = ((step) / STEP_COUNT) * 100;
    return (
      <View style={styles.progressSection}>
        <View style={styles.stepLabelRow}>
          {STEP_LABELS.map((label, i) => (
            <View key={label} style={styles.stepLabelItem}>
              <View
                style={[
                  styles.stepDot,
                  i + 1 <= step ? styles.stepDotActive : styles.stepDotInactive,
                ]}
              >
                {i + 1 < step ? (
                  <Ionicons name="checkmark" size={12} color={LUNA_COLORS.textInverse} />
                ) : (
                  <Text style={[
                    styles.stepDotNum,
                    i + 1 <= step ? styles.stepDotNumActive : null,
                  ]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabelText,
                  i + 1 === step ? styles.stepLabelActive : null,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>
    );
  }

  // ── Rendu étape 1 ────────────────────────────────────────────────────────────
  function renderStep1(): React.JSX.Element {
    return (
      <>
        <Text style={styles.stepTitle}>Numéro de téléphone</Text>
        <Text style={styles.stepDescription}>
          Entrez votre numéro pour recevoir un code de vérification par SMS.
        </Text>
        <Input
          label="Téléphone"
          value={telephone}
          onChangeText={(v) => { clearError(); setTelephone(v); }}
          keyboardType="phone-pad"
          placeholder="Ex : 55 123 456"
          returnKeyType="done"
          onSubmitEditing={handleSendCode}
          leftIcon={
            <Ionicons name="call-outline" size={20} color={LUNA_COLORS.textSecondary} />
          }
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionRow}>
          <Button title="Envoyer le code" onPress={handleSendCode} loading={loading} fullWidth />
        </View>
      </>
    );
  }

  // ── Rendu étape 2 ────────────────────────────────────────────────────────────
  function renderStep2(): React.JSX.Element {
    return (
      <>
        <Text style={styles.stepTitle}>Code de vérification</Text>
        <Text style={styles.stepDescription}>
          Entrez le code à 6 chiffres envoyé au {telephone}.
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { otpRefs.current[i] = r; }}
              value={digit}
              onChangeText={(v) => { clearError(); handleOtpChange(v, i); }}
              onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              accessibilityLabel={`Chiffre ${i + 1} du code OTP`}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionRow}>
          <Button title="Vérifier le code" onPress={handleVerifyCode} loading={loading} fullWidth />
        </View>

        <Pressable onPress={() => { setStep(1); setOtp(Array(OTP_LENGTH).fill('')); setError(null); }} style={styles.backLink}>
          <Ionicons name="arrow-back-outline" size={16} color={LUNA_COLORS.secondary} />
          <Text style={styles.backLinkText}>Changer le numéro</Text>
        </Pressable>
      </>
    );
  }

  // ── Rendu étape 3 ────────────────────────────────────────────────────────────
  function renderStep3(): React.JSX.Element {
    return (
      <>
        <Text style={styles.stepTitle}>Nouveau mot de passe</Text>
        <Text style={styles.stepDescription}>
          Choisissez un mot de passe sécurisé d'au moins {MIN_PW_LEN} caractères.
        </Text>
        <Input
          label="Nouveau mot de passe"
          value={nouveauMdp}
          onChangeText={(v) => { clearError(); setNouveauMdp(v); }}
          secureTextEntry
          placeholder="••••••••"
          returnKeyType="next"
          leftIcon={
            <Ionicons name="lock-closed-outline" size={20} color={LUNA_COLORS.textSecondary} />
          }
        />
        <Input
          label="Confirmer le mot de passe"
          value={confirmMdp}
          onChangeText={(v) => { clearError(); setConfirmMdp(v); }}
          secureTextEntry
          placeholder="••••••••"
          returnKeyType="done"
          onSubmitEditing={handleReset}
          leftIcon={
            <Ionicons name="lock-closed-outline" size={20} color={LUNA_COLORS.textSecondary} />
          }
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionRow}>
          <Button title="Réinitialiser" onPress={handleReset} loading={loading} fullWidth />
        </View>
      </>
    );
  }

  // ── Rendu principal ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Bouton retour */}
          <Pressable onPress={() => router.back()} style={styles.navBack}>
            <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.dark} />
          </Pressable>

          {/* Titre page */}
          <Text style={[typography.h3, styles.pageTitle]}>
            Mot de passe oublié
          </Text>

          {/* Stepper */}
          {renderProgress()}

          {/* Carte du step courant */}
          <Card style={styles.card}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: LUNA_COLORS.background,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: spacing.xxl,
    paddingTop:        spacing.lg,
    paddingBottom:     80,
  },

  // Navigation
  navBack: {
    width:  44,
    height: 44,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   spacing.sm,
  },
  pageTitle: {
    color:        LUNA_COLORS.dark,
    marginBottom: spacing.xxl,
  },

  // Stepper
  progressSection: {
    marginBottom: spacing.xxl,
  },
  stepLabelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   spacing.md,
  },
  stepLabelItem: {
    alignItems: 'center',
    flex:       1,
    gap:        spacing.xs,
  },
  stepDot: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: LUNA_COLORS.secondary,
  },
  stepDotInactive: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth:     1.5,
    borderColor:     LUNA_COLORS.borderSubtle,
  },
  stepDotNum: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textDisabled,
  },
  stepDotNumActive: {
    color: LUNA_COLORS.textInverse,
  },
  stepLabelText: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color:      LUNA_COLORS.secondary,
    fontWeight: fontWeight.semibold,
  },
  progressTrack: {
    height:          4,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius:    borderRadius.full,
    overflow:        'hidden',
  },
  progressFill: {
    height:          4,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius:    borderRadius.full,
  },

  // Carte
  card: {
    padding: spacing.xxl,
  },
  stepTitle: {
    fontSize:     fontSize.xl,
    fontWeight:   fontWeight.semibold,
    color:        LUNA_COLORS.dark,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize:     fontSize.sm,
    color:        LUNA_COLORS.textSecondary,
    lineHeight:   20,
    marginBottom: spacing.xl,
  },

  // OTP
  otpRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   spacing.lg,
    gap:            spacing.sm,
  },
  otpInput: {
    flex:            1,
    height:          52,
    borderWidth:     1.5,
    borderColor:     LUNA_COLORS.borderInput,
    borderRadius:    borderRadius.md,
    backgroundColor: LUNA_COLORS.inputBg,
    textAlign:       'center',
    fontSize:        fontSize.xl,
    fontWeight:      fontWeight.bold,
    color:           LUNA_COLORS.darkest,
  },
  otpInputFilled: {
    borderColor:     LUNA_COLORS.secondary,
    backgroundColor: LUNA_COLORS.infoLight,
  },

  // Erreur
  errorText: {
    color:        LUNA_COLORS.error,
    fontSize:     fontSize.sm,
    marginBottom: spacing.md,
    textAlign:    'center',
  },

  // Bouton action
  actionRow: {
    marginTop: spacing.sm,
  },

  // Lien retour
  backLink: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.lg,
    gap:            spacing.xs,
  },
  backLinkText: {
    color:      LUNA_COLORS.secondary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
