import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { apiGet } from '@/src/api/client';
import { MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Contact {
  id: string;
  nom: string;
  prenom: string;
  role?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageDate?: string;
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function MessagerieScreen(): React.JSX.Element {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<Contact[]>(MESSAGES.CONTACTS(userId));
      // Filter only MEDECIN contacts for radiologue
      const filtered = (data ?? []).filter((c) => c.role === 'MEDECIN' || c.role === 'ROLE_MEDECIN');
      setContacts(filtered);
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messagerie</Text>
        <Text style={styles.sub}>{contacts.length} contact(s)</Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={[LUNA_COLORS.secondary]} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.contactCard}
            onPress={() => router.push(`/(radiologue)/messagerie/${item.id}` as never)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.prenom.charAt(0)}{item.nom.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>Dr {item.prenom} {item.nom}</Text>
              <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage ?? 'Aucun message'}</Text>
            </View>
            {(item.unreadCount ?? 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon="chatbubbles-outline" title="Aucun contact" subtitle="Vos conversations avec les médecins apparaîtront ici." />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  header: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, backgroundColor: LUNA_COLORS.surface, ...(shadows.sm as object) },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  sub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  // ✨ Liste — paddingBottom tab bar
  list: { paddingTop: spacing.md, paddingBottom: 80 },
  // ✨ Carte HeroUI — borderSubtle + shadow sm
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: LUNA_COLORS.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.xxl, marginBottom: spacing.sm, borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle, ...(shadows.sm as object) },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: LUNA_COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: LUNA_COLORS.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  info: { flex: 1 },
  name: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.dark },
  lastMsg: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: LUNA_COLORS.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: LUNA_COLORS.textInverse, fontSize: 10, fontWeight: fontWeight.bold },
});
