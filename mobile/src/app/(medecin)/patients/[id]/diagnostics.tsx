import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '@/src/api/client';
import { CONSULTATIONS } from '@/src/api/endpoints';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientDiagnosticsScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Array<{ id?: string; diagnostic?: string; dateConsultation?: string }>>([]);

  useEffect(() => {
    if (!id) return;
    apiGet(CONSULTATIONS.BY_PATIENT(id)).then(setItems).catch(() => setItems([]));
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Diagnostics" />
      <FlatList
        data={items}
        keyExtractor={(item, i) => item.id ?? String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.diagnostic ?? '—'}</Text>
            <Text style={styles.meta}>
              {item.dateConsultation ? new Date(item.dateConsultation).toLocaleDateString('fr-FR') : ''}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { padding: spacing.lg },
  card: { backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm }, // ✨
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
