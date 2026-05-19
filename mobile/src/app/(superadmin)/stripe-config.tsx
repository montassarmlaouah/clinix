import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface StripeConfig {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  modeFacturation?: 'TEST' | 'LIVE';
  publishableConfigured?: boolean;
  stripeSecretConfigured?: boolean;
  webhookConfigured?: boolean;
}

export default function StripeConfigScreen() {
  const [config, setConfig] = useState<StripeConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<StripeConfig>(BILLING.STRIPE_CONFIG);
      setConfig(data ?? {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await apiPost(BILLING.STRIPE_CONFIG, {
        modeFacturation: config.modeFacturation ?? 'TEST',
        publishableKey: config.publishableKey,
        secretKey: config.secretKey,
        webhookSecret: config.webhookSecret,
      });
      Alert.alert('Succès', 'Configuration Stripe sauvegardée.');
      await load(); // recharge pour mettre à jour les booléens
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Stripe" subtitle="Configuration" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
        </View>
      </LunaScreen>
    );
  }

  const mode = config.modeFacturation ?? 'TEST';

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Stripe" subtitle="Configuration des clés API" showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Mode TEST / LIVE */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.cardTitle}>Mode de facturation</Text>
              <Text style={styles.cardSub}>
                {mode === 'TEST' ? 'Environnement de test' : 'Environnement LIVE (argent réel)'}
              </Text>
            </View>
            <View style={styles.modePills}>
              <TouchableOpacity
                style={[styles.modePill, mode === 'TEST' && styles.modePillActive]}
                onPress={() => setConfig((c) => ({ ...c, modeFacturation: 'TEST' }))}
              >
                <Text style={[styles.modePillText, mode === 'TEST' && styles.modePillTextActive]}>
                  TEST
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modePill, mode === 'LIVE' && styles.modePillLiveActive]}
                onPress={() => setConfig((c) => ({ ...c, modeFacturation: 'LIVE' }))}
              >
                <Text style={[styles.modePillText, mode === 'LIVE' && styles.modePillTextActive]}>
                  LIVE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Clés API */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clés API</Text>
          <ConfigField
            label="Publishable Key"
            value={config.publishableKey}
            onChange={(v) => setConfig((c) => ({ ...c, publishableKey: v }))}
            placeholder="pk_test_…"
            isConfigured={config.publishableConfigured}
            secure={false}
          />
          <ConfigField
            label="Secret Key"
            value={config.secretKey}
            onChange={(v) => setConfig((c) => ({ ...c, secretKey: v }))}
            placeholder="sk_test_…"
            isConfigured={config.stripeSecretConfigured}
            secure
          />
        </View>

        {/* Webhook */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Webhook</Text>
          <ConfigField
            label="Webhook Secret"
            value={config.webhookSecret}
            onChange={(v) => setConfig((c) => ({ ...c, webhookSecret: v }))}
            placeholder="whsec_…"
            isConfigured={config.webhookConfigured}
            secure
          />
          <Text style={styles.helperText}>
            Assurez-vous que l’URL du webhook est configurée dans votre Dashboard Stripe.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.75}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer la configuration'}</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </LunaScreen>
  );
}

function ConfigField({
  label, value, onChange, placeholder, isConfigured, secure,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
  isConfigured?: boolean;
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isConfigured !== undefined && (
          <View style={[styles.configBadge, isConfigured ? styles.configOk : styles.configMissing]}>
            <Ionicons name={isConfigured ? 'checkmark-circle' : 'alert-circle'} size={12} color={isConfigured ? LUNA_COLORS.success : LUNA_COLORS.error} />
            <Text style={[styles.configBadgeText, { color: isConfigured ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
              {isConfigured ? 'Configurée' : 'Manquante'}
            </Text>
          </View>
        )}
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={LUNA_COLORS.textDisabled}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // ✨ ScrollView — paddingBottom tab bar
  scroll: { padding: spacing.lg, paddingBottom: 80 },

  // ✨ Carte HeroUI — borderSubtle + shadow sm
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  cardTitle: {
    ...typography.sectionTitle,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 14,
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontSize: 12,
    color: LUNA_COLORS.textSecondary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  modePills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  modePillActive: {
    backgroundColor: LUNA_COLORS.warning + '1a',
    borderColor: LUNA_COLORS.warning,
  },
  modePillLiveActive: {
    backgroundColor: LUNA_COLORS.success + '1a',
    borderColor: LUNA_COLORS.success,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: LUNA_COLORS.textSecondary,
  },
  modePillTextActive: {
    color: LUNA_COLORS.textPrimary,
  },

  field: {
    marginTop: spacing.md,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    ...typography.sectionTitle,
    marginBottom: 0,
    letterSpacing: 0.4,
  },
  configBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  configOk: {
    backgroundColor: LUNA_COLORS.successLight,
  },
  configMissing: {
    backgroundColor: LUNA_COLORS.errorLight,
  },
  configBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  // ✨ Inputs HeroUI
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 52,
    fontSize: 14,
    color: LUNA_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
  },
  helperText: {
    fontSize: 11,
    color: LUNA_COLORS.textDisabled,
    marginTop: spacing.md,
  },
  // ✨ Bouton primaire — secondary pill, hauteur 48
  saveBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.full,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...(shadows.button as object),
  },
  saveBtnText: {
    ...typography.button,
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});