import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
import {
  Badge,
  EmptyState,
  LoadingOverlay,
  LunaHeroHeader,
  LunaScreen,
  LunaStatCard,
} from '@/src/components/common';
import { useAuthStore } from '@/src/store/auth.store';
import type { PersonnelMember, PersonnelRole } from '@/src/types/personnel';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';
import { normalizeTelephoneDigits } from '@/src/utils/telephone';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

const ROLE_CHIPS: { role: PersonnelRole; label: string; icon: IonIcon }[] = [
  { role: 'MEDECIN', label: 'Médecins', icon: 'medical-outline' },
  { role: 'INFIRMIER', label: 'Infirmiers', icon: 'medkit-outline' },
  { role: 'PHARMACIEN', label: 'Pharmaciens', icon: 'flask-outline' },
  { role: 'SECRETAIRE', label: 'Secrétaires', icon: 'headset-outline' },
  { role: 'RADIOLOGUE', label: 'Radiologues', icon: 'scan-outline' },
  { role: 'CHEF_PERSONNEL', label: 'Chefs personnel', icon: 'briefcase-outline' },
  { role: 'TECHNICIEN_MAINTENANCE', label: 'Techniciens', icon: 'construct-outline' },
];

const ROLE_STAT_ICON: Record<PersonnelRole, IonIcon> = {
  MEDECIN: 'medical-outline',
  INFIRMIER: 'medkit-outline',
  PHARMACIEN: 'flask-outline',
  SECRETAIRE: 'headset-outline',
  RADIOLOGUE: 'scan-outline',
  CHEF_PERSONNEL: 'briefcase-outline',
  TECHNICIEN_MAINTENANCE: 'construct-outline',
};

function roleLabelSingular(role: PersonnelRole): string {
  const chip = ROLE_CHIPS.find((c) => c.role === role);
  if (!chip) return role;
  return chip.label.replace(/s$/, '');
}

function statutBadge(actif?: boolean) {
  if (actif) return { label: 'Actif', color: 'success' as const };
  return { label: 'En attente', color: 'warning' as const };
}

export function AdminPersonnelScreen(): React.JSX.Element {
  const router = useRouter();
  const cliniqueIdRaw = useAuthStore((s) => s.cliniqueId);
  const cliniqueIdStr = cliniqueIdRaw != null ? String(cliniqueIdRaw) : '';

  const [activeRole, setActiveRole] = useState<PersonnelRole>('MEDECIN');
  const [byRole, setByRole] = useState<Partial<Record<PersonnelRole, PersonnelMember[]>>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PersonnelMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const liste = byRole[activeRole] ?? [];

  const load = useCallback(
    async (silent = false) => {
      if (!cliniqueIdStr) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const entries = await Promise.all(
          ROLE_CHIPS.map(async ({ role }) => {
            try {
              const data = await personnelService.listByRole(role, cliniqueIdStr);
              return [role, Array.isArray(data) ? data : []] as const;
            } catch {
              return [role, []] as const;
            }
          }),
        );
        setByRole(Object.fromEntries(entries) as Record<PersonnelRole, PersonnelMember[]>);
      } catch {
        setByRole({});
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cliniqueIdStr],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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

  const roleSingular = roleLabelSingular(activeRole);

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

  const listHeader = (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Gestion du Personnel</Text>
        <Text style={styles.pageSubtitle}>
          Gérer les médecins, infirmiers et tout le personnel médical de la clinique
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {ROLE_CHIPS.map((chip) => {
          const on = chip.role === activeRole;
          const count = byRole[chip.role]?.length ?? 0;
          return (
            <Pressable
              key={chip.role}
              onPress={() => setActiveRole(chip.role)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Ionicons
                name={chip.icon}
                size={16}
                color={on ? LUNA_COLORS.textInverse : LUNA_COLORS.textSecondary}
              />
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{chip.label}</Text>
              <View style={[styles.chipCount, on && styles.chipCountOn]}>
                <Text style={[styles.chipCountTxt, on && styles.chipCountTxtOn]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <LunaStatCard
            label="Total personnel"
            value={stats.total}
            icon="people-outline"
            color={LUNA_COLORS.primary}
            style={styles.statCard}
          />
          <LunaStatCard
            label="Actifs"
            value={stats.actifs}
            icon="checkmark-circle-outline"
            color={LUNA_COLORS.success}
            style={styles.statCard}
          />
        </View>
        <View style={styles.statsRow}>
          <LunaStatCard
            label="En attente"
            value={stats.enAttente}
            icon="time-outline"
            color={LUNA_COLORS.warning}
            style={styles.statCard}
          />
          <LunaStatCard
            label={ROLE_CHIPS.find((c) => c.role === activeRole)?.label ?? roleSingular}
            value={stats.total}
            icon={ROLE_STAT_ICON[activeRole]}
            color={LUNA_COLORS.secondary}
            style={styles.statCard}
          />
        </View>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Rechercher un {roleSingular}</Text>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Nom, prénom, téléphone…"
          placeholderTextColor={LUNA_COLORS.textDisabled}
        />
        <Pressable style={styles.addPrimary} onPress={openAdd}>
          <Ionicons name="person-add-outline" size={18} color={LUNA_COLORS.textInverse} />
          <Text style={styles.addPrimaryTxt}>Ajouter {roleSingular}</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Personnel"
        subtitle={`${stats.total} membre(s) • ${stats.actifs} actif(s)`}
        showBack={false}
      />

      {loading ? <LoadingOverlay /> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
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
              <View style={styles.avatar}>
                <Ionicons name={ROLE_STAT_ICON[activeRole]} size={22} color={LUNA_COLORS.secondary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>
                    {item.prenom} {item.nom}
                  </Text>
                  <Badge label={badge.label} color={badge.color} />
                </View>
                <Text style={styles.meta}>
                  <Ionicons name="call-outline" size={12} color={LUNA_COLORS.textSecondary} />{' '}
                  {item.telephone}
                </Text>
                {item.specialite ? <Text style={styles.meta}>{item.specialite}</Text> : null}
                {item.clinique?.nom ? (
                  <Text style={styles.meta}>{item.clinique.nom}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              title="Aucun membre"
              subtitle={`Ajoutez un ${roleSingular.toLowerCase()} avec le bouton ci-dessus.`}
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
              <Text style={styles.detailLine}>Rôle : {roleSingular}</Text>
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
                Statut : {detail.actif ? 'Compte actif' : "En attente d'activation"}
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
  pageIntro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
  },
  pageSubtitle: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  chips: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨ bordure subtile
    marginRight: spacing.sm,
  },
  chipOn: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  chipTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  chipTxtOn: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold },
  chipCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  chipCountOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipCountTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: LUNA_COLORS.textSecondary },
  chipCountTxtOn: { color: LUNA_COLORS.textInverse },
  statsGrid: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, minWidth: 0 },
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  filterLabel: {
    ...typography.sectionTitle, // ✨ titre section
  },
  search: {
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
  addPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.lg, // ✨ coins 16px
    paddingVertical: spacing.md,
    minHeight: 52,
    ...(shadows.button as object),
  },
  addPrimaryTxt: {
    color: LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 80 }, // ✨ espace tab bar
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface, // ✨ surface blanche
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...(shadows.sm as object),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LUNA_COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest,
  },
  meta: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
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
  detailName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginBottom: spacing.lg,
  },
  detailLine: { fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, marginBottom: spacing.sm },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.error,
    backgroundColor: LUNA_COLORS.errorLight, // ✨ badge errorLight
  },
  dangerTxt: { fontSize: fontSize.base, color: LUNA_COLORS.error, fontWeight: fontWeight.semibold },
  disabled: { opacity: 0.6 },
});
