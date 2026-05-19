// app/(superadmin)/medecins-admin.tsx
// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, TouchableOpacity,
  RefreshControl, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiDelete } from '@/src/api/client';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  specialite?: string;
  telephone?: string;
  actif: boolean;
  estCabinet?: boolean;
}

export default function MedecinsAdminScreen() {
  const [medecins, setMedecins]       = useState<Medecin[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Medecin[]>('/api/medecins');
      setMedecins(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = medecins.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.nom.toLowerCase().includes(q) ||
      m.prenom.toLowerCase().includes(q) ||
      (m.specialite ?? '').toLowerCase().includes(q)
    );
  });

  const actifs   = filtered.filter((m) => m.actif).length;
  const inactifs = filtered.filter((m) => !m.actif).length;

  function confirmDesactiver(med: Medecin) {
    Alert.alert('Désactiver', `Désactiver Dr. ${med.prenom} ${med.nom} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Désactiver', style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/api/personnel/medecins/${med.id}`);
            load(true);
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Médecins" subtitle="Chargement…" showBack={false} />
        <View style={styles.center}>
          <ActivityIndicator color={LUNA_COLORS.secondary} size="large" />
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader
        title="Cabinets médecins"
        subtitle={`${medecins.length} médecin(s)`}
        showBack={false}
      />

      {/* Search + stats */}
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={LUNA_COLORS.textDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un médecin…"
            placeholderTextColor={LUNA_COLORS.textDisabled}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={LUNA_COLORS.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <View style={[styles.miniDot, { backgroundColor: LUNA_COLORS.success }]} />
            <Text style={styles.miniStatText}>{actifs} actifs</Text>
          </View>
          <View style={styles.miniStat}>
            <View style={[styles.miniDot, { backgroundColor: LUNA_COLORS.error }]} />
            <Text style={styles.miniStatText}>{inactifs} inactifs</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
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
          const initials = `${item.prenom[0] ?? ''}${item.nom[0] ?? ''}`.toUpperCase();
          return (
            <View style={[styles.card, !item.actif && styles.cardInactive]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, !item.actif && styles.avatarInactive]}>
                  <Text style={[styles.avatarText, !item.actif && styles.avatarTextInactive]}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.nom, !item.actif && styles.nomInactive]}>
                      Dr. {item.prenom} {item.nom}
                    </Text>
                    <View style={[styles.actifBadge, item.actif ? styles.badgeActif : styles.badgeInactif]}>
                      <Text style={[styles.actifBadgeText, { color: item.actif ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
                        {item.actif ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                  {item.specialite ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="medical-outline" size={12} color={LUNA_COLORS.textDisabled} />
                      <Text style={styles.infoText}>{item.specialite}</Text>
                    </View>
                  ) : null}
                  {item.telephone ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={12} color={LUNA_COLORS.textDisabled} />
                      <Text style={styles.infoText}>{item.telephone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {item.estCabinet && (
                <View style={styles.cabinetTag}>
                  <Ionicons name="home-outline" size={11} color={LUNA_COLORS.tertiary} />
                  <Text style={styles.cabinetTagText}>Cabinet indépendant</Text>
                </View>
              )}

              {item.actif && (
                <TouchableOpacity
                  style={styles.desactiverBtn}
                  onPress={() => confirmDesactiver(item)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="person-remove-outline" size={15} color={LUNA_COLORS.error} />
                  <Text style={styles.desactiverBtnText}>Désactiver</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={40} color={LUNA_COLORS.textDisabled} />
            <Text style={styles.emptyText}>
              {search ? 'Aucun résultat pour cette recherche' : 'Aucun médecin trouvé'}
            </Text>
          </View>
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Top bar */
  topBar: {
    backgroundColor: LUNA_COLORS.surface,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨ séparateur subtil
    gap: spacing.md,
  },
  // ✨ Input recherche HeroUI
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    minHeight: 52,
    borderWidth: 1, borderColor: LUNA_COLORS.borderInput,
  },
  searchInput: { flex: 1, fontSize: 14, color: LUNA_COLORS.textPrimary, padding: 0 },
  miniStats: { flexDirection: 'row', gap: spacing.lg },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniStatText: { fontSize: 12, color: LUNA_COLORS.textSecondary, fontWeight: '600' },

  // ✨ Liste — paddingBottom tab bar
  list: { padding: spacing.lg, paddingBottom: 80 },

  /* Card */
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, ...(shadows.sm as object),
  },
  cardInactive: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', gap: spacing.md },

  /* Avatar */
  avatar: {
    width: 46, height: 46, borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInactive: { backgroundColor: LUNA_COLORS.surfaceLight },
  avatarText: { fontSize: 15, fontWeight: '700', color: LUNA_COLORS.primary },
  avatarTextInactive: { color: LUNA_COLORS.textDisabled },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 5, flexWrap: 'wrap' },
  nom: { fontSize: 14, fontWeight: '700', color: LUNA_COLORS.textPrimary, flex: 1 },
  nomInactive: { color: LUNA_COLORS.textSecondary },

  actifBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  badgeActif: { backgroundColor: LUNA_COLORS.successLight },
  badgeInactif: { backgroundColor: LUNA_COLORS.errorLight },
  actifBadgeText: { fontSize: 10, fontWeight: '700' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  infoText: { fontSize: 12, color: LUNA_COLORS.textSecondary },

  cabinetTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(197, 220, 234, 0.6)',
  },
  cabinetTagText: { fontSize: 12, color: LUNA_COLORS.tertiary, fontWeight: '600' },

  // ✨ Bouton destructif — pill borderRadius full
  desactiverBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: spacing.md, height: 48,
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: LUNA_COLORS.error + '30',
  },
  desactiverBtnText: { color: LUNA_COLORS.error, fontWeight: '700', fontSize: 13 },

  emptyBox: { alignItems: 'center', paddingTop: 64, gap: spacing.md },
  emptyText: { color: LUNA_COLORS.textDisabled, fontSize: 14, textAlign: 'center' },
});