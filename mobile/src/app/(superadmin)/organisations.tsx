// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { apiGet, apiPut } from '@/src/api/client';
import { CLINIQUES } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Organisation {
  id: string;
  nom: string;
  type?: 'CLINIQUE' | 'CABINET';
  actif: boolean;
  adresse?: string;
  telephone?: string;
  email?: string;
  abonnementActif?: boolean;
  statut?: { statut: string };
}

const STATUT_COLORS: Record<string, string> = {
  ACTIF: '#22c55e',
  GRACE: '#f59e0b',
  EXPIRE: '#ef4444',
  PERIODE_ESSAI: '#3b82f6',
};

export default function OrganisationsScreen() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Organisation[]>(CLINIQUES.LIST);
      setOrgs(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function confirmSuspendre(org: Organisation) {
    Alert.alert('Suspendre', `Suspendre "${org.nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Suspendre', style: 'destructive',
        onPress: async () => {
          try {
            // PUT /api/cliniques/{id} — pas de route /suspendre, on passe actif: false
            await apiPut(CLINIQUES.UPDATE(org.id), { ...org, actif: false });
            load(true);
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Cliniques" subtitle="Chargement…" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator color={LUNA_COLORS.primary} size="large" />
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Cliniques" subtitle={`${orgs.length} organisation(s)`} showBack={false} />
      <FlatList
        data={orgs}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => {
          const statut = item.statut?.statut ?? 'INCONNU';
          const statutColor = STATUT_COLORS[statut] ?? '#94a3b8';
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'CLINIQUE' ? LUNA_COLORS.primary : LUNA_COLORS.secondary }]}>
                  <Text style={styles.badgeText}>{item.type}</Text>
                </View>
                <Text style={[styles.statut, { color: statutColor }]}>{statut}</Text>
              </View>
              <Text style={styles.nom}>{item.nom}</Text>
              <Text style={[styles.actif, { color: item.actif ? '#22c55e' : '#ef4444' }]}>
                {item.actif ? 'Active' : 'Suspendue'}
              </Text>
              {item.actif && (
                <Pressable style={styles.btn} onPress={() => confirmSuspendre(item)}>
                  <Text style={styles.btnText}>Suspendre</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune organisation trouvée.</Text>}
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LUNA_COLORS.background ?? '#0f172a' },
  title:      { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#fff', padding: spacing.lg, paddingBottom: 0 },
  card:       { backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  typeBadge:  { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  badgeText:  { color: '#fff', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  statut:     { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  nom:        { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff', marginBottom: spacing.xs },
  actif:      { fontSize: fontSize.sm, marginBottom: spacing.sm },
  btn:        { backgroundColor: '#ef4444', borderRadius: borderRadius.md, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
  btnText:    { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  empty:      { color: LUNA_COLORS.textSecondary ?? '#94a3b8', textAlign: 'center', marginTop: spacing.xxl },
});
