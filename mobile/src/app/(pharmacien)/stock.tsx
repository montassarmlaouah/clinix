import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { pharmacieService, type Medicament, type Stock } from '@/src/api/services/pharmacie.service';
import { EmptyState, ListCard, LoadingOverlay, LunaHeroHeader, LunaScreen, SegmentTabs } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type TabKey = 'medicaments' | 'stocks';

export default function PharmacienStockScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [tab, setTab] = useState<TabKey>('stocks');
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [meds, stk] = await Promise.all([
        pharmacieService.listMedicaments(),
        pharmacieService.listStocks(cliniqueId),
      ]);
      setMedicaments(meds ?? []);
      setStocks(stk ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Pharmacie" subtitle={`${stocks.length} stocks · ${medicaments.length} médicaments`}>
        <SegmentTabs<TabKey>
          options={[
            { key: 'stocks', label: 'Stocks' },
            { key: 'medicaments', label: 'Médicaments' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </LunaHeroHeader>

      <FlatList
        data={tab === 'stocks' ? stocks : medicaments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => {
          if (tab === 'medicaments') {
            const m = item as Medicament;
            return (
              <View style={styles.card}>
                <Text style={styles.name}>{m.nom}</Text>
                {m.description ? <Text style={styles.meta}>{m.description}</Text> : null}
              </View>
            );
          }
          const s = item as Stock;
          const bas = s.quantite <= (s.seuilAlerte ?? 0);
          return (
            <View style={[styles.card, bas && styles.cardAlert]}>
              <Text style={styles.name}>{s.medicament?.nom ?? '—'}</Text>
              <Text style={styles.meta}>Lot {s.lot} • Qté {s.quantite}</Text>
              <Text style={styles.meta}>Seuil {s.seuilAlerte}</Text>
              {bas ? <Text style={styles.alert}>Stock bas</Text> : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="medkit-outline"
            title="Aucune donnée"
            subtitle={tab === 'stocks' ? 'Aucun stock enregistré.' : 'Aucun médicament.'}
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  cardAlert: {
    borderColor: LUNA_COLORS.danger,
    backgroundColor: `${LUNA_COLORS.danger}08`,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: 13,
    color: LUNA_COLORS.textSecondary,
    marginBottom: spacing.xs,
  },
  alert: {
    fontSize: 12,
    fontWeight: '600',
    color: LUNA_COLORS.danger,
    marginTop: spacing.xs,
  },
});
