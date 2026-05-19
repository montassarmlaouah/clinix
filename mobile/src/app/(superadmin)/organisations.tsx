// app/(superadmin)/organisations.tsx
// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, TouchableOpacity,
  RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPut } from '@/src/api/client';
import { CLINIQUES } from '@/src/api/endpoints';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';

interface Organisation {
  id: string;
  nom: string;
  type?: 'CLINIQUE' | 'CABINET';
  actif: boolean;
  adresse?: string;
  telephone?: string;
  email?: string;
  abonnementActif?: boolean;
  statut?: { statut: string };
}

const STATUT_META: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  ACTIF:          { color: LUNA_COLORS.success, bg: LUNA_COLORS.successLight, label: 'Actif',         icon: 'checkmark-circle' },
  GRACE:          { color: LUNA_COLORS.warning, bg: '#fef3c7',                label: 'Grâce',          icon: 'time' },
  EXPIRE:         { color: LUNA_COLORS.error,   bg: LUNA_COLORS.errorLight,   label: 'Expiré',         icon: 'close-circle' },
  PERIODE_ESSAI:  { color: LUNA_COLORS.tertiary, bg: '#e0fafa',               label: 'Période essai',  icon: 'flask' },
};

const FILTRE_OPTIONS = ['Toutes', 'Actives', 'Suspendues', 'Essai'] as const;
type FiltreOption = typeof FILTRE_OPTIONS[number];

export default function OrganisationsScreen() {
  const [orgs, setOrgs]               = useState<Organisation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [filtre, setFiltre]           = useState<FiltreOption>('Toutes');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Organisation[]>(CLINIQUES.LIST);
      setOrgs(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredOrgs = orgs.filter((o) => {
    const statut = o.statut?.statut ?? '';
    if (filtre === 'Actives')    return o.actif && statut === 'ACTIF';
    if (filtre === 'Suspendues') return !o.actif || statut === 'EXPIRE';
    if (filtre === 'Essai')      return statut === 'PERIODE_ESSAI';
    return true;
  });

  function confirmSuspendre(org: Organisation) {
    Alert.alert('Suspendre', `Suspendre "${org.nom}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Suspendre', style: 'destructive',
        onPress: async () => {
          try {
            await apiPut(CLINIQUES.UPDATE(org.id), { ...org, actif: false });
            load(true);
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Cliniques" subtitle="Chargement…" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Cliniques"
        subtitle={`${orgs.length} organisation(s)`}
        showBack={false}
      />

      {/* Filtres */}
      <View style={styles.filtresRow}>
        {FILTRE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.filtrePill, filtre === opt && styles.filtrePillActive]}
            onPress={() => setFiltre(opt)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filtrePillText, filtre === opt && styles.filtrePillTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrgs}
        keyExtractor={(o) => o.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            colors={[LUNA_COLORS.secondary]}
            tintColor={LUNA_COLORS.secondary}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const statut     = item.statut?.statut ?? 'INCONNU';
          const meta       = STATUT_META[statut] ?? { color: LUNA_COLORS.textDisabled, bg: LUNA_COLORS.surfaceLight, label: statut, icon: 'help-circle' };
          const initials   = item.nom.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
          const isClinic   = item.type === 'CLINIQUE';

          return (
            <View style={styles.card}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: isClinic ? LUNA_COLORS.infoLight : LUNA_COLORS.warningLight }]}>
                  <Text style={[styles.avatarText, { color: isClinic ? LUNA_COLORS.primary : LUNA_COLORS.warning }]}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orgNom} numberOfLines={1}>{item.nom}</Text>
                  <View style={styles.badgesRow}>
                    <View style={[styles.typeBadge, { backgroundColor: isClinic ? LUNA_COLORS.infoLight : LUNA_COLORS.warningLight }]}>
                      <Text style={[styles.typeBadgeText, { color: isClinic ? LUNA_COLORS.primary : LUNA_COLORS.warning }]}>
                        {item.type ?? 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.statutBadge, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon as any} size={10} color={meta.color} />
                      <Text style={[styles.statutBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.activeDot, { backgroundColor: item.actif ? LUNA_COLORS.success : LUNA_COLORS.error }]} />
              </View>

              {/* Infos optionnelles */}
              {(item.adresse || item.telephone) && (
                <View style={styles.cardInfo}>
                  {item.adresse ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={12} color={LUNA_COLORS.textDisabled} />
                      <Text style={styles.infoText} numberOfLines={1}>{item.adresse}</Text>
                    </View>
                  ) : null}
                  {item.telephone ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={12} color={LUNA_COLORS.textDisabled} />
                      <Text style={styles.infoText}>{item.telephone}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Action */}
              {item.actif && (
                <TouchableOpacity
                  style={styles.suspendreBtn}
                  onPress={() => confirmSuspendre(item)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="pause-circle-outline" size={16} color={LUNA_COLORS.error} />
                  <Text style={styles.suspendreBtnText}>Suspendre</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="business-outline" size={40} color={LUNA_COLORS.textDisabled} />
            <Text style={styles.emptyText}>Aucune organisation trouvée</Text>
          </View>
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Filtres */
  filtresRow: {
    flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨ séparateur subtil
  },
  // ✨ Chips filtre — pill full radius
  filtrePill: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle,
  },
  filtrePillActive: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  filtrePillText: { fontSize: 12, fontWeight: '600', color: LUNA_COLORS.textSecondary },
  filtrePillTextActive: { color: LUNA_COLORS.textInverse },

  list: { padding: spacing.lg, paddingBottom: 80 },

  /* Card */
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, ...(shadows.sm as object),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },

  /* Avatar */
  avatar: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '700' },

  orgNom: { fontSize: 15, fontWeight: '700', color: LUNA_COLORS.textPrimary, marginBottom: spacing.xs },

  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  typeBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },

  statutBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full,
  },
  statutBadgeText: { fontSize: 10, fontWeight: '700' },

  activeDot: {
    width: 10, height: 10, borderRadius: 5, flexShrink: 0,
  },

  /* Info rows */
  cardInfo: { gap: spacing.xs, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(197, 220, 234, 0.6)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 11, color: LUNA_COLORS.textSecondary, flex: 1 },

  /* Suspendre button */
  suspendreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: spacing.md, height: 48,
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: LUNA_COLORS.error + '30',
  },
  suspendreBtnText: { color: LUNA_COLORS.error, fontWeight: '700', fontSize: 13 },

  emptyBox: { alignItems: 'center', paddingTop: 64, gap: spacing.md },
  emptyText: { color: LUNA_COLORS.textDisabled, fontSize: 14 },
});