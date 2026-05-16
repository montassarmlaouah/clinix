import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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

import { personnelService } from '@/src/api/services/personnel.service';
import { Badge, EmptyState, LoadingOverlay, LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import type { PersonnelMember, PersonnelRole } from '@/src/types/personnel';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { normalizeTelephoneDigits } from '@/src/utils/telephone';

const ROLE_CHIPS: { role: PersonnelRole; label: string }[] = [
  { role: 'MEDECIN', label: 'Médecins' },
  { role: 'INFIRMIER', label: 'Infirmiers' },
  { role: 'PHARMACIEN', label: 'Pharmaciens' },
  { role: 'SECRETAIRE', label: 'Secrétaires' },
  { role: 'RADIOLOGUE', label: 'Radiologues' },
  { role: 'CHEF_PERSONNEL', label: 'Chefs personnel' },
  { role: 'TECHNICIEN_MAINTENANCE', label: 'Techniciens' },
];

function roleLabel(role: string): string {
  return ROLE_CHIPS.find((c) => c.role === role)?.label.replace(/s$/, '') ?? role;
}

function statutBadge(actif?: boolean) {
  if (actif) return { label: 'Actif', color: 'success' as const };
  return { label: 'En attente', color: 'warning' as const };
}

export function AdminPersonnelScreen(): React.JSX.Element {
  const router = useRouter();
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const [activeRole, setActiveRole] = useState<PersonnelRole>('MEDECIN');
  const [liste, setListe] = useState<PersonnelMember[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PersonnelMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!cliniqueId) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const data = await personnelService.listByRole(activeRole, cliniqueId);
        setListe(Array.isArray(data) ? data : []);
      } catch {
        setListe([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cliniqueId, activeRole],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return liste;
    return liste.filter(
      (p) =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        normalizeTelephoneDigits(p.telephone).includes(q.replace(/\D/g, '')) ||
        (p.specialite ?? '').toLowerCase().includes(q),
    );
  }, [liste, query]);

  const stats = useMemo(() => {
    const actifs = liste.filter((p) => p.actif).length;
    return { total: liste.length, actifs, enAttente: liste.length - actifs };
  }, [liste]);

  function openAdd() {
    router.push(`/(admin)/personnel/nouveau?role=${activeRole}` as never);
  }

  function confirmDeactivate(person: PersonnelMember) {
    const name = `${person.prenom} ${person.nom}`.trim();
    Alert.alert(
      'Désactiver le compte',
      `Désactiver ${name} ? Le compte ne pourra plus se connecter.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: () => void handleDeactivate(person),
        },
      ],
    );
  }

  async function handleDeactivate(person: PersonnelMember) {
    setDeleting(true);
    try {
      await personnelService.supprimer(activeRole, String(person.id));
      setDetail(null);
      await load(true);
    } catch {
      Alert.alert('Erreur', 'Impossible de désactiver ce membre.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Personnel"
        subtitle={`${stats.total} membre(s) • ${stats.actifs} actif(s)`}
        showBack={false}
        right={
          <Pressable onPress={openAdd} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {ROLE_CHIPS.map((chip) => {
          const on = chip.role === activeRole;
          return (
            <Pressable
              key={chip.role}
              onPress={() => setActiveRole(chip.role)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
        renderItem={({ item }) => {
          const badge = statutBadge(item.actif);
          return (
            <Pressable style={styles.card} onPress={() => setDetail(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>
                  {item.prenom} {item.nom}
                </Text>
                <Badge label={badge.label} color={badge.color} />
              </View>
              <Text style={styles.meta}>{item.telephone}</Text>
              {item.specialite ? (
                <Text style={styles.meta}>{item.specialite}</Text>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              title="Aucun membre"
              subtitle="Ajoutez un membre du personnel."
            />
          ) : null
        }
      />

      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Détail</Text>
            <Pressable onPress={() => setDetail(null)} hitSlop={8}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.dark} />
            </Pressable>
          </View>
          {detail ? (
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.detailName}>
                {detail.prenom} {detail.nom}
              </Text>
              <Text style={styles.detailLine}>Rôle : {roleLabel(detail.role ?? activeRole)}</Text>
              <Text style={styles.detailLine}>Téléphone : {detail.telephone}</Text>
              {detail.specialite ? (
                <Text style={styles.detailLine}>Spécialité : {detail.specialite}</Text>
              ) : null}
              {detail.numeroPieceIdentite ? (
                <Text style={styles.detailLine}>CIN : {detail.numeroPieceIdentite}</Text>
              ) : null}
              {detail.email ? (
                <Text style={styles.detailLine}>E-mail : {detail.email}</Text>
              ) : null}
              <Text style={styles.detailLine}>
                Statut : {detail.actif ? 'Compte actif' : 'En attente d\'activation'}
              </Text>
              {detail.clinique?.nom ? (
                <Text style={styles.detailLine}>Clinique : {detail.clinique.nom}</Text>
              ) : null}

              <Pressable
                style={[styles.dangerBtn, deleting && styles.disabled]}
                disabled={deleting}
                onPress={() => confirmDeactivate(detail)}
              >
                <Ionicons name="ban-outline" size={18} color={LUNA_COLORS.error} />
                <Text style={styles.dangerTxt}>
                  {deleting ? 'Désactivation…' : 'Désactiver le compte'}
                </Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    marginRight: spacing.sm,
  },
  chipOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  chipTxtOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  search: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  modal: { flex: 1, backgroundColor: LUNA_COLORS.background, paddingTop: spacing.xxxl },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  modalBody: { padding: spacing.xxl, paddingBottom: 80 },
  detailName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest, marginBottom: spacing.lg },
  detailLine: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, marginBottom: spacing.sm },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.error,
    backgroundColor: LUNA_COLORS.errorLight,
  },
  dangerTxt: { fontSize: fontSize.base, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
  disabled: { opacity: 0.6 },
});
