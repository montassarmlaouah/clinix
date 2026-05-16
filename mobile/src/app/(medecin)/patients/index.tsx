import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { patientService, type Patient } from '@/src/api/services/patient.service';
import { MEDECINS } from '@/src/api/endpoints';
import { apiGet } from '@/src/api/client';
import { EmptyState, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { hasMedecinClinique } from '@/src/utils/medecinContext';

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export default function MedecinPatientsScreen(): React.JSX.Element {
  const router = useRouter();
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const medecinId = useAuthStore((s) => s.userId);

  const scope = useMemo<'clinique' | 'cabinet'>(() => {
    if (scopeParam === 'clinique' || scopeParam === 'cabinet') return scopeParam;
    if (hasMedecinClinique(cliniqueId)) return 'clinique';
    return 'cabinet';
  }, [scopeParam, cliniqueId]);

  const title =
    scope === 'clinique' ? 'Patients clinique' : 'Patients cabinet';

  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patients,   setPatients]   = useState<Patient[]>([]);
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(async () => {
    if (!medecinId) return;
    try {
      const data = await apiGet<Patient[]>(MEDECINS.PATIENTS_LIST(medecinId));
      setAllPatients(data ?? []);
      setPatients(data ?? []);
    } catch { /* keep previous */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medecinId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleSearch(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setPatients(allPatients); return; }
    debounceRef.current = setTimeout(() => {
      const lower = text.trim().toLowerCase();
      const filtered = allPatients.filter((p) =>
        p.nom.toLowerCase().includes(lower) || p.prenom.toLowerCase().includes(lower)
      );
      setPatients(filtered);
    }, 400);
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title={title}
        subtitle={`${patients.length} patient(s)`}
        showBack={false}
        right={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={() => router.push('/(medecin)/scanner' as never)} style={styles.iconBtn}>
            <Ionicons name="scan-outline" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
          <Pressable onPress={() => router.push('/(medecin)/patients/nouveau' as never)} style={styles.iconBtn}>
            <Ionicons name="add" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
        </View>
        }
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={LUNA_COLORS.textSecondary} />
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Rechercher par nom, prénom…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); loadAll(); }}>
            <Ionicons name="close-circle" size={18} color={LUNA_COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={patients}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setQuery(''); loadAll(); }}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(medecin)/patients/${item.id}` as never)}
          >
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{getInitials(item.nom, item.prenom)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
                <Text style={styles.patientPhone}>{item.telephone}</Text>
                {item.cin ? <Text style={styles.patientCin}>CIN : {item.cin}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun patient trouvé"
            subtitle={query ? 'Aucun résultat pour cette recherche.' : 'Aucun patient enregistré.'}
          />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: LUNA_COLORS.background },
  header:      {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  headerCount: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    backgroundColor:   LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.border,
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.md,
  },
  searchInput: {
    flex:               1,
    fontSize:           fontSize.base,
    color:              LUNA_COLORS.textPrimary,
    paddingVertical:    spacing.xs,
    includeFontPadding: false,
  },
  listContent: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor:   LUNA_COLORS.surface,
    borderRadius:      borderRadius.md,
    marginBottom:      spacing.md,
    padding:           spacing.lg,
    ...(shadows.sm as object),
  },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt:    { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  cardInfo:     { flex: 1 },
  patientName:  { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  patientPhone: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  patientCin:   { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
