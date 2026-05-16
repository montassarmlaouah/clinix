import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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

import { Card, EmptyState, LoadingOverlay } from '@/src/components/common';
import { type Patient } from '@/src/api/services/patient.service';
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

// ── Carte patient ─────────────────────────────────────────────────────────────
function PatientCard({ patient, onPress }: { patient: Patient; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {getInitials(patient.nom, patient.prenom)}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.patientName}>
              {patient.prenom} {patient.nom}
            </Text>
            <Text style={styles.patientPhone}>{patient.telephone}</Text>
            {patient.cin ? (
              <Text style={styles.patientCin}>CIN : {patient.cin}</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textSecondary} />
        </View>
      </Card>
    </Pressable>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function PatientsScreen(): React.JSX.Element {
  const router     = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [query,       setQuery]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement initial — tous les patients de la clinique
  const loadAll = useCallback(async () => {
    if (!cliniqueId) return;
    try {
      const data = await apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId));
      setAllPatients(data);
      setPatients(data);
    } catch {
      /* garder la liste précédente */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId]);

  // Recharge à chaque fois que l'écran revient au premier plan
  useFocusEffect(
    useCallback(() => {
      setQuery('');
      loadAll();
    }, [loadAll])
  );

  const handleRefresh = () => { setRefreshing(true); setQuery(''); loadAll(); };

  // Recherche locale (l'endpoint /recherche n'existe pas dans le backend)
  function handleSearch(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = text.trim().toLowerCase();
    if (q.length < 2) {
      setPatients(allPatients);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const filtered = allPatients.filter((p) =>
        (p.nom?.toLowerCase().includes(q) ?? false) ||
        (p.prenom?.toLowerCase().includes(q) ?? false) ||
        (p.telephone?.toLowerCase().includes(q) ?? false)
      );
      setPatients(filtered);
    }, 300);
  }

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patients</Text>
        <Text style={styles.headerCount}>{patients.length} enregistrés</Text>
      </View>

      {/* SearchBar sticky */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={LUNA_COLORS.textSecondary} />
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Rechercher par nom, prénom…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => { setQuery(''); loadAll(); }}>
            <Ionicons name="close-circle" size={18} color={LUNA_COLORS.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Liste */}
      <FlatList
        data={patients}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            onPress={() => router.push(`/(secretaire)/patients/${item.id}` as never)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Aucun patient trouvé"
            subtitle={
              query.trim().length > 0
                ? 'Aucun résultat pour votre recherche.'
                : 'Aucun patient enregistré dans cette clinique.'
            }
          />
        }
      />

      {/* FAB — Nouveau patient */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(secretaire)/patients/nouveau')}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un patient"
      >
        <Ionicons name="add" size={26} color={LUNA_COLORS.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: LUNA_COLORS.background,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    ...(shadows.sm as object),
  },
  headerTitle: {
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.darkest,
  },
  headerCount: {
    fontSize:  fontSize.sm,
    color:     LUNA_COLORS.textSecondary,
    marginTop: 2,
  },

  // SearchBar
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

  // Liste
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop:        spacing.md,
    paddingBottom:     100,
  },
  card: {
    marginBottom: spacing.md,
    padding:      spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarTxt: {
    color:      LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
    fontSize:   fontSize.base,
  },
  cardInfo: {
    flex: 1,
  },
  patientName: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.darkest,
  },
  patientPhone: {
    fontSize:  fontSize.sm,
    color:     LUNA_COLORS.textSecondary,
    marginTop: 2,
  },
  patientCin: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.tertiary,
    marginTop: 2,
  },

  // FAB
  fab: {
    position:        'absolute',
    bottom:          spacing.xxl,
    right:           spacing.xxl,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems:      'center',
    justifyContent:  'center',
    ...(shadows.lg as object),
  },
});
