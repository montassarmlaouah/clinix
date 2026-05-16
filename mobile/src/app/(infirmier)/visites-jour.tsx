import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rdvService, type RendezVous } from '@/src/api/services/rdv.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export default function InfirmierVisitesJourScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [dateJour, setDateJour] = useState(new Date().toISOString().slice(0, 10));
  const [visites, setVisites] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await rdvService.getRdvCliniqueJour(cliniqueId, dateJour);
      setVisites(data ?? []);
    } catch { setVisites([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId, dateJour]);

  useEffect(() => { load(); }, [load]);

  async function valider(rdv: RendezVous) {
    if (!rdv.id) return;
    try {
      await rdvService.validationVisiteInfirmier(rdv.id, { signer: true });
      load(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Validation impossible');
    }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Visites du jour" />
      <TextInput style={styles.dateInput} value={dateJour} onChangeText={setDateJour} placeholder="AAAA-MM-JJ" />
      <FlatList
        data={visites}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.patientPrenom} {item.patientNom}</Text>
            <Text style={styles.meta}>{new Date(item.dateHeure).toLocaleString('fr-FR')}</Text>
            <Text style={styles.meta}>{item.motif}</Text>
            <Pressable style={styles.btn} onPress={() => valider(item)}>
              <Text style={styles.btnText}>Valider la visite</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="home-outline" title="Aucune visite" subtitle="" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  dateInput: { margin: spacing.lg, backgroundColor: LUNA_COLORS.surface, padding: spacing.md, borderRadius: borderRadius.md },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: { backgroundColor: LUNA_COLORS.surface, padding: spacing.lg, borderRadius: borderRadius.md, marginBottom: spacing.md, ...(shadows.sm as object) },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  btn: { marginTop: spacing.md, backgroundColor: LUNA_COLORS.success, padding: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  btnText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
