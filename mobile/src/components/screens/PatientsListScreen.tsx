import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface PatientsListScreenProps {
  /** Route de détail patient, ex. `/(secretaire)/patients` → push `${base}/${id}` */
  detailRouteBase: string;
  title?: string;
  showAdd?: boolean;
  addRoute?: string;
  /** Affiche le basculement actifs / archivés et la réactivation */
  showArchives?: boolean;
}

export function PatientsListScreen({
  detailRouteBase,
  title = 'Patients',
  showAdd = false,
  addRoute,
  showArchives = false,
}: PatientsListScreenProps): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [liste, setListe] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'actifs' | 'archives'>('actifs');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!cliniqueId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data =
        showArchives && view === 'archives'
          ? await patientService.getInactifsByClinique(cliniqueId)
          : await patientService.getByClinique(cliniqueId);
      setListe(data ?? []);
    } catch {
      setListe([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliniqueId, showArchives, view]);

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

  async function reactiver(patient: Patient) {
    if (!patient.id) return;
    Alert.alert(
      'Réactiver le patient',
      `Réactiver ${patient.prenom} ${patient.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réactiver',
          onPress: async () => {
            setReactivatingId(patient.id);
            try {
              await patientService.reactiverPatient(patient.id);
              Alert.alert('Succès', 'Patient réactivé.');
              void load(true);
            } catch (e: unknown) {
              Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec');
            } finally {
              setReactivatingId(null);
            }
          },
        },
      ],
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title={title}
        subtitle={`${filtered.length} patient(s)`}
        showBack={false}
        right={
          showAdd && addRoute && view === 'actifs' ? (
            <Pressable onPress={() => router.push(addRoute as never)} style={styles.addBtn}>
              <Text style={styles.add}>+ Nouveau</Text>
            </Pressable>
          ) : undefined
        }
      />
      {showArchives ? (
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.viewBtn, view === 'actifs' && styles.viewBtnActive]}
            onPress={() => setView('actifs')}
          >
            <Text style={[styles.viewBtnText, view === 'actifs' && styles.viewBtnTextActive]}>Actifs</Text>
          </Pressable>
          <Pressable
            style={[styles.viewBtn, view === 'archives' && styles.viewBtnActive]}
            onPress={() => setView('archives')}
          >
            <Text style={[styles.viewBtnText, view === 'archives' && styles.viewBtnTextActive]}>Archivés</Text>
          </Pressable>
        </View>
      ) : null}
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
          <View style={styles.cardWrap}>
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
            {showArchives && view === 'archives' ? (
              <Pressable
                style={styles.reactivateBtn}
                onPress={() => void reactiver(item)}
                disabled={reactivatingId === item.id}
              >
                <Text style={styles.reactivateText}>
                  {reactivatingId === item.id ? 'Réactivation…' : 'Réactiver'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              title={view === 'archives' ? 'Aucun patient archivé' : 'Aucun patient'}
              subtitle=""
            />
          ) : null
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  viewBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  viewBtnActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  viewBtnText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  viewBtnTextActive: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  addBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  search: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderInput,
    fontSize: fontSize.md,
    color: LUNA_COLORS.darkest,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 80 },
  cardWrap: { marginBottom: spacing.md },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.secondary,
    ...(shadows.sm as object),
  },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 4 },
  add: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  reactivateBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: LUNA_COLORS.secondaryLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  reactivateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary,
  },
});
