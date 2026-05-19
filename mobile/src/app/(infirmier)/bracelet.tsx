import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function InfirmierBraceletScreen(): React.JSX.Element {
  const router = useRouter();
  const [id, setId] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Bracelet patient" />
      <View style={styles.body}>
        <Text style={styles.hint}>Saisissez ou scannez l&apos;identifiant du bracelet.</Text>
        <TextInput style={styles.input} value={id} onChangeText={setId} placeholder="ID patient" />
        <Pressable
          style={styles.btn}
          onPress={() => id.trim() && router.push(`/(infirmier)/soins?patientId=${id.trim()}` as never)}
        >
          <Text style={styles.btnText}>Ouvrir les soins</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/(infirmier)/scanner' as never)}>
          <Text style={styles.linkText}>Utiliser le scanner</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.xxl, gap: spacing.md },
  hint: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    padding: spacing.md,
    fontSize: fontSize.base,
  }, // ✨
  btn: { backgroundColor: LUNA_COLORS.secondary, padding: spacing.md, borderRadius: borderRadius.full, minHeight: 48,
    alignItems: 'center' }, // ✨
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  link: { alignItems: 'center', padding: spacing.md },
  linkText: { color: LUNA_COLORS.secondary, fontSize: fontSize.sm },
});
