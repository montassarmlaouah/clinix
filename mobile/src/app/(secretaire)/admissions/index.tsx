import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { PATIENTS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface PatientRow {
  id:             string;
  nom:            string;
  prenom:         string;
  telephone?:     string;
  numeroPatient?: string;
  dateNaissance?: string;
  actif?:         boolean;
}

export default function AdmissionsIndexScreen(): React.JSX.Element {
  const router      = useRouter();
  const cliniqueId  = useAuthStore((s) => s.cliniqueId);
  const [patients, setPatients]     = useState<PatientRow[]>([]);
  const [filtered, setFiltered]     = useState<PatientRow[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<PatientRow[]>(PATIENTS.BY_CLINIQUE(cliniqueId!));
      setPatients(data);
      setFiltered(data);
    } catch {
      setPatients([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(patients);
    } else {
      const q = search.toLowerCase();
      setFiltered(patients.filter((p) =>
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        (p.numeroPatient ?? '').toLowerCase().includes(q)
      ));
    }
  }, [search, patients]);

  if (loading) return <LoadingOverlay />;

  function renderPatient({ item }: { item: PatientRow }) {
    return (
      <Pressable
        style={cardStyles.card}
        onPress={() => router.push(`/(secretaire)/patients/${item.id}` as never)}
      >
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarTxt}>
            {item.prenom.charAt(0)}{item.nom.charAt(0)}
          </Text>
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{item.prenom} {item.nom}</Text>
          {item.numeroPatient ? (
            <Text style={cardStyles.meta}>N° {item.numeroPatient}</Text>
          ) : null}
          {item.telephone ? (
            <Text style={cardStyles.meta}>{item.telephone}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Admissions récentes</Text>
        <Pressable
          onPress={() => router.push('/(secretaire)/admissions/creer' as never)}
          style={styles.addBtn}
        >
          <Ionicons name="add-circle-outline" size={22} color={LUNA_COLORS.secondary} />
          <Text style={styles.addBtnTxt}>Nouvelle</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={LUNA_COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un patient…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderPatient}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun patient"
            subtitle="Aucun patient trouvé pour cette organisation."
          />
        }
      />
    </SafeAreaView>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  LUNA_COLORS.surface,
    borderRadius:     borderRadius.md,
    padding:          spacing.md,
    marginHorizontal: spacing.xxl,
    marginBottom:     spacing.sm,
    ...(shadows.sm as object),
  },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarTxt: {
    color: LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  info: { flex: 1 },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.dark,
  },
  meta: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  title:    { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.infoLight,
  },
  addBtnTxt: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.secondary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xxl,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  list: { paddingTop: spacing.sm, paddingBottom: 60 },
});