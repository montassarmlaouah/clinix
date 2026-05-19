import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { apiGet } from '@/src/api/client';
import { CHAMBRES } from '@/src/api/endpoints';
import { EmptyState, ListCard, LoadingOverlay } from '@/src/components/common';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface Chambre {
  id: string | number;
  numero: string;
  type?: string;
  statut?: string;
  capacite?: number;
  disponible?: boolean;
}

interface Props {
  detailRoutePrefix?: string;
}

export function ChambresListScreen({ detailRoutePrefix }: Props): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [liste, setListe] = useState<Chambre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  usePageHeader({
    title: 'Chambres',
    subtitle: `${liste.length} chambre(s)`,
    showBack: false,
    showMenu: true,
    showBrand: true,
  });

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Chambre[]>(CHAMBRES.BY_CLINIQUE(cliniqueId));
      setListe(data ?? []);
    } catch {
      setListe([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.root}>
      <FlatList
        data={liste}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={liste.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); void load(true); }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        renderItem={({ item }) => (
          <ListCard
            title={`Chambre ${item.numero}`}
            subtitle={item.type ?? '—'}
            meta={item.capacite != null ? `Capacité : ${item.capacite}` : undefined}
            statusBar={item.disponible === false ? 'alert' : 'muted'}
            left={
              <View style={styles.thumb}>
                <Ionicons name="bed-outline" size={22} color={LUNA_COLORS.secondary} />
              </View>
            }
            right={
              <Ionicons name="create-outline" size={20} color={LUNA_COLORS.secondary} />
            }
            onPress={
              detailRoutePrefix
                ? () => router.push(`${detailRoutePrefix}/${item.id}` as never)
                : undefined
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="bed-outline" title="Aucune chambre" subtitle="Aucune chambre configurée." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUNA_COLORS.background },
  list: { paddingBottom: 80 }, // ✨ espace tab bar
  listEmpty: { flexGrow: 1, paddingBottom: 80 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg, // ✨ coins 16px
    backgroundColor: LUNA_COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
