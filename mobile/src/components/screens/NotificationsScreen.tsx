import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiDelete, apiGet } from '@/src/api/client';
import { NOTIFICATIONS } from '@/src/api/endpoints';
import {
  notificationService,
  type NotificationItem,
} from '@/src/api/services/notification.service';
import { EmptyState, LoadingOverlay } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Onglets ────────────────────────────────────────────────────────────────────
type Tab = 'aujourdhui' | 'toutes' | 'nonlues';

const TABS: { key: Tab; label: string }[] = [
  { key: 'aujourdhui', label: "Aujourd'hui" },
  { key: 'nonlues', label: 'Non lues' },
  { key: 'toutes', label: 'Toutes' },
];

// ── Couleur / icône par type ───────────────────────────────────────────────────
function typeColor(type: string): string {
  switch (type) {
    case 'SUCCESS': return LUNA_COLORS.success;
    case 'WARNING': return LUNA_COLORS.warning;
    case 'ERROR':   return LUNA_COLORS.error;
    default:        return LUNA_COLORS.secondary;
  }
}

function typeIcon(type: string): string {
  switch (type) {
    case 'SUCCESS': return 'checkmark-circle-outline';
    case 'WARNING': return 'warning-outline';
    case 'ERROR':   return 'close-circle-outline';
    default:        return 'information-circle-outline';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Composant principal ────────────────────────────────────────────────────────
export function NotificationsScreen(): React.JSX.Element {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('aujourdhui');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let data: NotificationItem[];
      if (tab === 'aujourdhui') {
        data = await notificationService.listToday();
      } else if (tab === 'nonlues') {
        data = await notificationService.listUnread();
      } else {
        data = await apiGet<NotificationItem[]>(NOTIFICATIONS.LIST);
      }
      setItems(data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  async function markOne(id: number): Promise<void> {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    } catch { /* ignore */ }
  }

  async function markAll(): Promise<void> {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, lu: true })));
    } catch { /* ignore */ }
  }

  function deleteOne(id: number): void {
    Alert.alert('Supprimer', 'Supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete<void>(NOTIFICATIONS.DELETE(id));
            setItems((prev) => prev.filter((n) => n.id !== id));
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  function openLink(url: string): void {
    try {
      router.push(url as never);
    } catch { /* ignore */ }
  }

  const unreadCount = items.filter((n) => !n.lu).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Notifications"
        subtitle={`${unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout lu'}`}
      />

      {/* Barre d'onglets */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Actions globales */}
      {unreadCount > 0 ? (
        <Pressable style={styles.markAllBar} onPress={() => void markAll()}>
          <Ionicons name="checkmark-done-outline" size={16} color={LUNA_COLORS.secondary} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </Pressable>
      ) : null}

      {loading ? <LoadingOverlay /> : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(true); }}
              tintColor={LUNA_COLORS.secondary}
            />
          }
          renderItem={({ item }) => {
            const color = typeColor(item.type ?? 'INFO');
            const icon  = typeIcon(item.type ?? 'INFO');
            return (
              <Pressable
                style={[styles.card, !item.lu && styles.cardUnread, { borderLeftColor: color }]}
                onPress={() => { if (!item.lu) void markOne(item.id); }}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
                    <Ionicons name={icon as never} size={20} color={color} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.titre}</Text>
                      {!item.lu ? <View style={styles.dot} /> : null}
                    </View>
                    <Text style={styles.cardMsg}>{item.message}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardDate}>{formatDate(item.dateCreation)}</Text>
                      {item.actionUrl ? (
                        <Pressable onPress={() => openLink(item.actionUrl!)} style={styles.openBtn}>
                          <Text style={styles.openBtnText}>Ouvrir</Text>
                          <Ionicons name="arrow-forward-outline" size={12} color={LUNA_COLORS.secondary} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <Pressable onPress={() => deleteOne(item.id)} style={styles.deleteBtn} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color={LUNA_COLORS.textSecondary} />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="Aucune notification"
              subtitle={tab === 'nonlues' ? 'Tout est lu.' : 'Rien pour cet onglet.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: LUNA_COLORS.background },
  tabs:           { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderSubtle },
  tab:            { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive:      { backgroundColor: LUNA_COLORS.secondaryLight },
  tabText:        { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  tabTextActive:  { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  markAllBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm, backgroundColor: LUNA_COLORS.surface, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.borderSubtle },
  markAllText:    { fontSize: fontSize.sm, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  list:           { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...(shadows.sm as object),
  },
  cardUnread:     { backgroundColor: '#f0f9ff' },
  cardRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconWrap:       { width: 38, height: 38, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:       { flex: 1 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle:      { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest, flex: 1 },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: LUNA_COLORS.secondary },
  cardMsg:        { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 2 },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  cardDate:       { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  openBtn:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openBtnText:    { fontSize: fontSize.xs, color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold },
  deleteBtn:      { padding: spacing.xs },
});
