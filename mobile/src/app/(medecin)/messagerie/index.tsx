import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
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
  id:                   number;
  nom:                  string;
  prenom:               string;
  role?:                string;
  dernierMessage?:      string;
  dernierMessageDate?:  string;
  unreadCount?:         number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ── Carte contact ─────────────────────────────────────────────────────────────
function ContactCard({
  contact,
  onPress,
}: {
  contact: Contact;
  onPress: () => void;
}): React.JSX.Element {
  const hasUnread = (contact.unreadCount ?? 0) > 0;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Avatar initiales */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
          <Text style={[styles.avatarTxt, hasUnread && styles.avatarTxtUnread]}>
            {getInitials(contact.nom, contact.prenom)}
          </Text>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, hasUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {contact.prenom} {contact.nom}
          </Text>
          <Text style={styles.time}>
            {formatTime(contact.dernierMessageDate)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.lastMsg, hasUnread && styles.lastMsgUnread]}
            numberOfLines={1}
          >
            {contact.dernierMessage ?? 'Aucun message'}
          </Text>
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadTxt}>
                {(contact.unreadCount ?? 0) > 9 ? '9+' : String(contact.unreadCount)}
              </Text>
            </View>
          ) : null}
        </View>
        {contact.role ? (
          <Text style={styles.role}>{contact.role.replace('ROLE_', '')}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────
export default function MessagerieScreen(): React.JSX.Element {
  const router  = useRouter();
  const userId  = useAuthStore((s) => s.userId);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const [contacts,   setContacts]   = useState<Contact[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet<Contact[]>(MESSAGES.CONTACTS(userId));
      // Trier: non-lus d'abord, puis par date desc
      const sorted = [...data].sort((a, b) => {
        const ua = a.unreadCount ?? 0;
        const ub = b.unreadCount ?? 0;
        if (ub !== ua) return ub - ua;
        const da = new Date(a.dernierMessageDate ?? 0).getTime();
        const db = new Date(b.dernierMessageDate ?? 0).getTime();
        return db - da;
      });
      setContacts(sorted);
    } catch { /* keep previous */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, cliniqueId]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  if (loading) return <LoadingOverlay />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messagerie</Text>
        <Text style={styles.headerSub}>{contacts.length} conversations</Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onPress={() =>
              router.push(
                {
                  pathname: '/(medecin)/messagerie/[contactId]' as never,
                  params: {
                    contactId: String(item.id),
                    nom:       `${item.prenom} ${item.nom}`,
                  },
                } as never
              )
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadContacts(); }}
            tintColor={LUNA_COLORS.secondary}
            colors={[LUNA_COLORS.secondary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="Aucune conversation"
            subtitle="Vous n'avez pas encore de messages."
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
  headerSub:   { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: 2 },

  listContent: { paddingBottom: 80 },
  separator:   { height: 0.5, backgroundColor: LUNA_COLORS.border, marginLeft: 72 + spacing.xxl },

  card: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.lg,
    backgroundColor:   LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    gap:               spacing.md,
  }, // ✨
  avatarWrap: { position: 'relative' },
  avatar: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     LUNA_COLORS.border,
  },
  avatarUnread: {
    backgroundColor: LUNA_COLORS.infoLight,
    borderColor:     LUNA_COLORS.secondary,
  },
  avatarTxt: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.tertiary,
  },
  avatarTxtUnread: { color: LUNA_COLORS.secondary },

  info:    { flex: 1 },
  topRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  name:    { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest },
  nameUnread: { fontWeight: fontWeight.bold },
  time:    { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },

  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lastMsg:   { flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  lastMsgUnread: { color: LUNA_COLORS.textPrimary, fontWeight: fontWeight.medium },

  unreadBadge: {
    minWidth:          18,
    height:            18,
    borderRadius:      borderRadius.full,
    backgroundColor:   LUNA_COLORS.secondary,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  unreadTxt: { color: LUNA_COLORS.textInverse, fontSize: 10, fontWeight: fontWeight.bold },

  role: { fontSize: fontSize.xs, color: LUNA_COLORS.tertiary, marginTop: 2 },
});
