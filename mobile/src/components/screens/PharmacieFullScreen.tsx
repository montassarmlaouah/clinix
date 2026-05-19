import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  pharmacieService,
  type DemandeMedicament,
  type Medicament,
  type Stock,
} from '@/src/api/services/pharmacie.service';
import { Button, EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

type TabKey = 'stocks' | 'medicaments' | 'demandes' | 'alertes';

export function PharmacieFullScreen(): React.JSX.Element {
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [tab, setTab] = useState<TabKey>('stocks');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [demandes, setDemandes] = useState<DemandeMedicament[]>([]);
  const [alertes, setAlertes] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMed, setNewMed] = useState('');

  const load = useCallback(async () => {
    try {
      const [stk, meds, dem, bas] = await Promise.all([
        pharmacieService.listStocks(cliniqueId),
        pharmacieService.listMedicaments(),
        pharmacieService.listDemandesEnAttente(cliniqueId),
        pharmacieService.listStocksBas(cliniqueId),
      ]);
      setStocks(stk ?? []);
      setMedicaments(meds ?? []);
      setDemandes(dem ?? []);
      setAlertes(bas ?? []);
    } catch {
      setStocks([]);
      setMedicaments([]);
      setDemandes([]);
      setAlertes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addMedicament = async () => {
    const nom = newMed.trim();
    if (!nom) return;
    await pharmacieService.createMedicament({ nom });
    setNewMed('');
    void load();
  };

  const validerDemande = async (id: string, statut: 'DELIVREE' | 'REFUSEE') => {
    await pharmacieService.changerStatutDemande(id, statut);
    void load();
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'stocks', label: 'Stocks' },
    { key: 'medicaments', label: 'Médicaments' },
    { key: 'demandes', label: 'Demandes' },
    { key: 'alertes', label: 'Alertes' },
  ];

  const data =
    tab === 'stocks' ? stocks :
    tab === 'medicaments' ? medicaments :
    tab === 'demandes' ? demandes :
    alertes;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Interface pharmacie" subtitle="Gestion complète" />
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'medicaments' ? (
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Nouveau médicament…"
            value={newMed}
            onChangeText={setNewMed}
            placeholderTextColor={LUNA_COLORS.textDisabled}
          />
          <Button title="Ajouter" onPress={() => void addMedicament()} />
        </View>
      ) : null}
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={data as unknown[]}
        keyExtractor={(item, i) => String((item as { id?: string }).id ?? i)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <EmptyState icon="medkit-outline" title="Aucune donnée" /> : null
        }
        renderItem={({ item }) => {
          if (tab === 'stocks' || tab === 'alertes') {
            const s = item as Stock;
            return (
              <View style={styles.card}>
                <Text style={styles.name}>{s.medicament?.nom ?? 'Stock'}</Text>
                <Text style={styles.meta}>Qté : {s.quantite} · Seuil : {s.seuilAlerte}</Text>
                {s.dateExpiration ? <Text style={styles.meta}>Exp. {s.dateExpiration}</Text> : null}
              </View>
            );
          }
          if (tab === 'medicaments') {
            const m = item as Medicament;
            return (
              <View style={styles.card}>
                <Text style={styles.name}>{m.nom}</Text>
                {m.description ? <Text style={styles.meta}>{m.description}</Text> : null}
              </View>
            );
          }
          const d = item as DemandeMedicament;
          const p = d.patient;
          return (
            <View style={styles.card}>
              <Text style={styles.name}>
                {p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() : `Demande #${d.id}`}
              </Text>
              <Text style={styles.meta}>{d.statut}</Text>
              <View style={styles.actions}>
                <Button title="Délivrer" size="sm" onPress={() => void validerDemande(d.id, 'DELIVREE')} />
                <Button title="Refuser" size="sm" variant="ghost" onPress={() => void validerDemande(d.id, 'REFUSEE')} />
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
  },
  tabActive: { backgroundColor: LUNA_COLORS.secondary },
  tabText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  tabTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  addRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond input HeroUI
    borderRadius: borderRadius.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  list: { padding: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  card: {
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.accentGold,
    ...(shadows.sm as object),
  },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
