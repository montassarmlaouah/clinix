// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface StripeConfig {
  // Champs à envoyer (POST /api/billing/stripe-config)
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  modeFacturation?: 'TEST' | 'LIVE';
  // Champs reçus (GET /api/billing/stripe-config)
  publishableKeyMasked?: string;
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
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      // POST /api/billing/stripe-config — BillingController
      await apiPost(BILLING.STRIPE_CONFIG, {
        modeFacturation:  config.modeFacturation ?? 'TEST',
        publishableKey:   config.publishableKey,
        secretKey:        config.secretKey,
        webhookSecret:    config.webhookSecret,
      });
      Alert.alert('Succès', 'Configuration Stripe sauvegardée.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la configuration.');
    } finally {
      setSaving(false);
    }
  }

  // Basculer mode TEST/LIVE directement dans la config locale (envoyé lors du save)
  function toggleMode(value: boolean) {
    setConfig((prev) => ({ ...prev, modeFacturation: value ? 'TEST' : 'LIVE' }));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={LUNA_COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.title}>Configuration Stripe</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Publishable Key</Text>
          <TextInput
            style={styles.input}
            value={config.publishableKey ?? ''}
            onChangeText={(v) => setConfig((p) => ({ ...p, publishableKey: v }))}
            placeholder="pk_..."
            placeholderTextColor={LUNA_COLORS.textSecondary ?? '#94a3b8'}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Secret Key</Text>
          <TextInput
            style={styles.input}
            value={config.secretKey ?? ''}
            onChangeText={(v) => setConfig((p) => ({ ...p, secretKey: v }))}
            placeholder="sk_... (masqué)"
            secureTextEntry
            placeholderTextColor={LUNA_COLORS.textSecondary ?? '#94a3b8'}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Webhook Secret</Text>
          <TextInput
            style={styles.input}
            value={config.webhookSecret ?? ''}
            onChangeText={(v) => setConfig((p) => ({ ...p, webhookSecret: v }))}
            placeholder="whsec_..."
            secureTextEntry
            placeholderTextColor={LUNA_COLORS.textSecondary ?? '#94a3b8'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Mode Test (cochez pour TEST, décochez pour LIVE)</Text>
          <Switch
            value={(config.modeFacturation ?? 'TEST') === 'TEST'}
            onValueChange={toggleMode}
            trackColor={{ true: LUNA_COLORS.primary, false: '#475569' }}
          />
        </View>

        <Pressable style={[styles.btn, saving && styles.btnDisabled]} onPress={save} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  title:       { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.xl },
  field:       { marginBottom: spacing.lg },
  label:       { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary ?? '#94a3b8', marginBottom: spacing.xs },
  input:       { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.md, padding: spacing.md, color: '#fff', fontSize: fontSize.base },
  switchRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  btn:         { backgroundColor: LUNA_COLORS.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.base },
});
