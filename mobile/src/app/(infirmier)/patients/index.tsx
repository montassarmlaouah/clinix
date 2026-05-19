import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { type Patient } from '@/src/api/services/patient.service';
import { patientService } from '@/src/api/services/patient.service';
import { PATIENTS } from '@/src/api/endpoints';
import { apiGet } from '@/src/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Helper ────────────────────────────────────────────────────────────────────
function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function InfirmierPatientsScreen(): React.JSX.Element {
  const router      = useRouter();
  const cliniqueId  = useAuthStore((s) => s.cliniqueId);

  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patients,   setPatients]   = useState<Patient[]>([]);
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMed,  setFilterMed]  = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      const data = await apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId));
      setAllPatients(data ?? []);
      setPatients(data ?? []);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

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

  const displayed = patients.filter((p) => {
    const matchesQuery = !query.trim() ||
      (p.nom + ' ' + p.prenom).toLowerCase().includes(query.trim().toLowerCase());
    const matchesMed = !filterMed ||
      (p as any).medecinReferentNom === filterMed;
    return matchesQuery && matchesMed;
  });

  const medecins = Array.from(new Set(patients.map((p) => (p as any).medecinReferentNom).filter(Boolean)));

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes patients</Text>
          <Text style={styles.headerCount}>{patients.length} patient{patients.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={() => router.push('/(infirmier)/scanner' as never)} style={styles.iconBtn}>
            <Ionicons name="scan-outline" size={22} color={LUNA_COLORS.success} />
          </Pressable>
          <Pressable onPress={() => { /* NFC placeholder */ }} style={styles.iconBtn}>
            <Ionicons name="radio-outline" size={22} color={LUNA_COLORS.success} />
          </Pressable>
        </View>
      </View>

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

      {/* Filtres médecin */}
      {medecins.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
          <Pressable onPress={() => setFilterMed(null)} style={[styles.filterChip, filterMed === null && styles.filterChipActive]}>
            <Text style={[styles.filterTxt, filterMed === null && styles.filterTxtActive]}>Tous</Text>
          </Pressable>
          {medecins.map((m) => (
            <Pressable key={m} onPress={() => setFilterMed(m)} style={[styles.filterChip, filterMed === m && styles.filterChipActive]}>
              <Text style={[styles.filterTxt, filterMed === m && styles.filterTxtActive]}>{m}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={displayed}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setQuery(''); setFilterMed(null); loadAll(); }}
            tintColor={LUNA_COLORS.success}
            colors={[LUNA_COLORS.success]}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(infirmier)/patients/${item.id}` as never)}
          >
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{getInitials(item.nom, item.prenom)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
                <Text style={styles.patientPhone}>
                  {(item as any).chambreNumero ? `Ch. ${(item as any).chambreNumero}` : '—'}
                  {(item as any).age ? ` · ${(item as any).age} ans` : ''}
                </Text>
                {(item as any).medecinReferentNom ? (
                  <Text style={styles.patientCin}>Dr {(item as any).medecinReferentNom}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun patient trouvé"
            subtitle={
              query
                ? 'Aucun résultat pour cette recherche.'
                : "Aucun patient dans cette clinique."
            }
          />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: {
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
    borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.md,
  },
  searchInput: {
    flex:               1,
    fontSize:           fontSize.base,
    color:              LUNA_COLORS.textPrimary,
    paddingVertical:    spacing.xs,
    includeFontPadding: false,
  }, // ✨
  listContent: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderRadius: borderRadius.lg,
    marginBottom:    spacing.md,
    padding:         spacing.lg,
    ...(shadows.sm as object),
  }, // ✨
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LUNA_COLORS.success,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt:    { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  cardInfo:     { flex: 1 },
  patientName:  { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  patientPhone: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  patientCin:   { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filterBar: { flexGrow: 0, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)' },
  filterContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  filterChipActive: { backgroundColor: LUNA_COLORS.success, borderColor: LUNA_COLORS.success },
  filterTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },
  filterTxtActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
});
