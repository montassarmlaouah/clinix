import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientTransfertScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Transfert" />
      <View style={styles.body}>
        <Pressable
          style={styles.btn}
          onPress={() => router.push(`/(medecin)/operations/nouveau?patientId=${id}` as never)}
        >
          <Text style={styles.btnText}>Créer une demande de transfert / opération</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  body: { padding: spacing.xxl },
  btn: { backgroundColor: LUNA_COLORS.secondary, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center' },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
});
