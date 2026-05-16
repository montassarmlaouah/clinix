import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { patientService, type Patient } from '@/src/api/services/patient.service';
import { EmptyState, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface PatientsListScreenProps {
  /** Route de détail patient, ex. `/(secretaire)/patients` → push `${base}/${id}` */
  detailRouteBase: string;
  title?: string;
  showAdd?: boolean;
  addRoute?: string;
}

export function PatientsListScreen({
  detailRouteBase,
  title = 'Patients',
  showAdd = false,
  addRoute,
}: PatientsListScreenProps): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [liste, setListe] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await patientService.getByClinique(cliniqueId);
      setListe(data ?? []);
    } catch {
      setListe([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter(
      (p) =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        (p.telephone ?? '').includes(q) ||
        (p.numeroPatient ?? '').toLowerCase().includes(q),
    );
  }, [liste, query]);

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title={title}
        subtitle={`${filtered.length} patient(s)`}
        showBack={false}
        right={
          showAdd && addRoute ? (
            <Pressable onPress={() => router.push(addRoute as never)} style={styles.addBtn}>
              <Text style={styles.add}>+ Nouveau</Text>
            </Pressable>
          ) : undefined
        }
      />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher nom, téléphone…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
        />
      </View>
      {loading ? <LoadingOverlay /> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`${detailRouteBase}/${item.id}` as never)}
          >
            <Text style={styles.name}>
              {item.prenom} {item.nom}
            </Text>
            <Text style={styles.meta}>{item.telephone}</Text>
            {item.numeroPatient ? (
              <Text style={styles.meta}>N° {item.numeroPatient}</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="people-outline" title="Aucun patient" subtitle="" />
          ) : null
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  addBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  search: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    fontSize: fontSize.md,
    color: LUNA_COLORS.darkest,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.secondary,
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  add: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
