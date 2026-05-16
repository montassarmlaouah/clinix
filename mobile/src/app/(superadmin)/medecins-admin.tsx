// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet, apiDelete } from '@/src/api/client';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  specialite?: string;
  telephone?: string;
  actif: boolean;
  estCabinet?: boolean;
}

export default function MedecinsAdminScreen() {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Medecin[]>('/api/medecins');
      setMedecins(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function confirmDesactiver(med: Medecin) {
    Alert.alert('Désactiver', `Désactiver Dr. ${med.prenom} ${med.nom} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Désactiver', style: 'destructive',
        onPress: async () => {
          try {
            // DELETE /api/personnel/medecins/{id} — soft-delete (actif: false) dans PersonnelController
            await apiDelete(`/api/personnel/medecins/${med.id}`);
            load(true);
          } catch { /* ignore */ }
        },
      },
    ]);
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
      <Text style={styles.title}>Médecins</Text>
      <FlatList
        data={medecins}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.nom}>Dr. {item.prenom} {item.nom}</Text>
              <Text style={[styles.actifBadge, { color: item.actif ? '#22c55e' : '#ef4444' }]}>
                {item.actif ? 'Actif' : 'Inactif'}
              </Text>
            </View>
            {item.specialite ? <Text style={styles.detail}>{item.specialite}</Text> : null}
            {item.telephone ? <Text style={styles.detail}>{item.telephone}</Text> : null}
            {item.estCabinet && <Text style={styles.cabinet}>Cabinet indépendant</Text>}
            {item.actif && (
              <Pressable style={styles.btn} onPress={() => confirmDesactiver(item)}>
                <Text style={styles.btnText}>Désactiver</Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun médecin trouvé.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  title:       { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff', padding: spacing.lg, paddingBottom: 0 },
  card:        { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  nom:         { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: '#fff' },
  actifBadge:  { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  detail:      { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary ?? '#94a3b8', marginTop: 2 },
  cabinet:     { fontSize: fontSize.xs, color: LUNA_COLORS.primary, marginTop: spacing.xs, fontWeight: fontWeight.medium },
  btn:         { backgroundColor: '#ef4444', borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.md },
  btnText:     { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  empty:       { color: LUNA_COLORS.textSecondary ?? '#94a3b8', textAlign: 'center', marginTop: spacing.xxl },
});
