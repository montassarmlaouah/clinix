import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { apiGet } from '@/src/api/client';
import { HOSPITALISATIONS, PATIENTS } from '@/src/api/endpoints';
import { type Patient } from '@/src/api/services/patient.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { LunaPatientRowCard } from '@/src/components/patients/LunaPatientRowCard';
import { NewPatientModal } from '@/src/components/patients/NewPatientModal';
import { WardFilterChip } from '@/src/components/patients/WardFilterChip';
import { useAuthStore } from '@/src/store/auth.store';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import {
  buildPatientRows,
  collectServiceFilters,
  filterPatientRows,
  sortPatientsByAge,
  type HospitalisationLite,
} from '@/src/utils/patientDisplay';

export default function PatientsScreen(): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [hospitalisations, setHospitalisations] = useState<HospitalisationLite[]>([]);
  const [query, setQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const loadAll = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      const [patients, hosp] = await Promise.all([
        apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId)),
        apiGet<HospitalisationLite[]>(HOSPITALISATIONS.EN_COURS).catch(() => [] as HospitalisationLite[]),
      ]);
      setAllPatients(Array.isArray(patients) ? patients : []);
      setHospitalisations(Array.isArray(hosp) ? hosp : []);
    } catch {
      /* liste précédente conservée */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  useFocusEffect(
    useCallback(() => {
      setQuery('');
      setServiceFilter('ALL');
      void loadAll();
    }, [loadAll]),
  );

  const rows = useMemo(() => {
    const built = buildPatientRows(allPatients, hospitalisations);
    const sorted = sortPatientsByAge(built, true);
    return filterPatientRows(sorted, query, serviceFilter);
  }, [allPatients, hospitalisations, query, serviceFilter]);

  const serviceOptions = useMemo(() => {
    const allRows = buildPatientRows(allPatients, hospitalisations);
    const services = collectServiceFilters(allRows);
    return [
      { value: 'ALL', label: `TOUS LES SERVICES (${allPatients.length})` },
      ...services.map((s) => ({
        value: s,
        label: `${s} (${allRows.filter((r) => r.serviceLabel === s).length})`,
      })),
    ];
  }, [allPatients, hospitalisations]);

  const setHeader = usePageHeaderStore((s) => s.setHeader);

  useFocusEffect(
    useCallback(() => {
      setHeader({
        title: 'Patients',
        showBrand: false,
        showNotifications: false,
        showProfil: false,
        showMenu: true,
        showBack: false,
        center: (
          <WardFilterChip
            label="Service"
            options={serviceOptions}
            value={serviceFilter}
            onChange={setServiceFilter}
          />
        ),
        right: (
          <Pressable
            style={styles.searchBtn}
            onPress={() => setSearchOpen((v) => !v)}
            accessibilityLabel="Rechercher"
          >
            <Ionicons name="search" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
        ),
      });
      return () => {
        setHeader({ title: '', center: undefined, right: undefined });
      };
    }, [serviceFilter, serviceOptions, setHeader]),
  );

  if (loading) return <LoadingOverlay />;

  return (
    <View style={styles.root}>
      {searchOpen ? (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={LUNA_COLORS.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Nom, chambre, médecin…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
            style={styles.searchInput}
            autoFocus
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={LUNA_COLORS.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.patient.id)}
        renderItem={({ item }) => (
          <LunaPatientRowCard
            row={item}
            onPress={() => router.push(`/(secretaire)/patients/${item.patient.id}` as never)}
          />
        )}
        contentContainerStyle={rows.length === 0 ? styles.listEmpty : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadAll();
            }}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun patient"
            subtitle="Aucun patient ne correspond à ce filtre."
          />
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => setShowNewModal(true)}
        accessibilityLabel="Nouveau patient"
      >
        <Ionicons name="add" size={26} color={LUNA_COLORS.textInverse} />
      </Pressable>

      <NewPatientModal
        visible={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={loadAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUNA_COLORS.background },
  searchBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: LUNA_COLORS.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)',
  },
  // ✨ Input HeroUI — inputBg, minHeight 52
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: LUNA_COLORS.textPrimary,
    backgroundColor: LUNA_COLORS.inputBg,
    minHeight: 52,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  // ✨ Liste — paddingBottom tab bar
  list: { paddingBottom: 80 },
  listEmpty: { flexGrow: 1, paddingBottom: 80 },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.lg as object),
  },
});
