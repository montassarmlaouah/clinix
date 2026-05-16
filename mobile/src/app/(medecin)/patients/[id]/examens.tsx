import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiPost } from '@/src/api/client';
import { IMAGERIES } from '@/src/api/endpoints';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function PatientExamensScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const medecinId = useAuthStore((s) => s.userId);
  const [items, setItems] = useState<unknown[]>([]);

  useEffect(() => {
    if (!id) return;
    apiGet(IMAGERIES.BY_PATIENT(id)).then(setItems).catch(() => setItems([]));
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Examens" />
      <Pressable
        style={styles.btn}
        onPress={() => medecinId && apiPost(IMAGERIES.DEMANDER, { patientId: id, medecinId, type: 'RADIO', motif: '', niveauUrgence: 'NORMALE' })}
      >
        <Text style={styles.btnText}>+ Demander examen</Text>
      </Pressable>
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(medecin)/patients/${id}/rapport/${(item as { id: string }).id}` as never)}
          >
            <Text style={styles.title}>{(item as { type?: string }).type ?? 'Examen'}</Text>
            <Text style={styles.meta}>{(item as { statut?: string }).statut}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  btn: { margin: spacing.lg, backgroundColor: LUNA_COLORS.secondary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold },
  list: { padding: spacing.lg },
  card: { backgroundColor: LUNA_COLORS.surface, padding: spacing.lg, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
});
