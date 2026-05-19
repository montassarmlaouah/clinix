import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { storage } from '@/src/store/storage';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const STORAGE_KEY = 'patientTeleconsultLien';

export default function PatientTeleconsultationScreen(): React.JSX.Element {
  const [lien, setLien] = useState('');

  useEffect(() => {
    storage.getItem(STORAGE_KEY).then((v) => { if (v) setLien(v); });
  }, []);

  async function save() {
    await storage.setItem(STORAGE_KEY, lien.trim());
  }

  function open() {
    const u = lien.trim();
    if (u) Linking.openURL(u);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Téléconsultation" />
      <View style={styles.body}>
        <Text style={styles.hint}>
          Collez le lien de visio fourni par votre clinique (Meet, Jitsi, etc.).
        </Text>
        <TextInput
          style={styles.input}
          value={lien}
          onChangeText={setLien}
          placeholder="https://..."
          autoCapitalize="none"
        />
        <Pressable style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>Enregistrer le lien</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnAlt]} onPress={open}>
          <Text style={styles.btnText}>Rejoindre la visio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.xxl, paddingBottom: 80, gap: spacing.md },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  btn: { backgroundColor: LUNA_COLORS.secondary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnAlt: { backgroundColor: LUNA_COLORS.info },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
});
