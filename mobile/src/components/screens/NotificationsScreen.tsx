import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { notificationService, type NotificationItem } from '@/src/api/services/notification.service';
import { EmptyState, LoadingOverlay, LunaScreen } from '@/src/components/common';
import { ScreenHeader } from '@/src/components/common/ScreenHeader';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export function NotificationsScreen(): React.JSX.Element {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await notificationService.listToday();
      setItems(data ?? []);
    } catch { setItems([]); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAll() {
    try {
      await notificationService.markAllRead();
      load(true);
    } catch { /* ignore */ }
  }

  async function markOne(id: number) {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    } catch { /* ignore */ }
  }

  if (loading) return <LoadingOverlay />;

  return (
    <LunaScreen edges={[]}>
      <ScreenHeader title="Notifications" subtitle={`${items.filter((n) => !n.lu).length} non lue(s)`} />
      {items.some((n) => !n.lu) ? (
        <Pressable style={styles.markAll} onPress={markAll}>
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </Pressable>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.lu && styles.cardUnread]}
            onPress={() => !item.lu && markOne(item.id)}
          >
            <Text style={styles.cardTitle}>{item.titre}</Text>
            <Text style={styles.cardMsg}>{item.message}</Text>
            <Text style={styles.cardDate}>
              {new Date(item.dateCreation).toLocaleString('fr-FR')}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon="notifications-outline" title="Aucune notification" subtitle="Rien pour aujourd'hui." />
        }
      />
    </LunaScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  markAll: { padding: spacing.md, alignItems: 'center', backgroundColor: LUNA_COLORS.surface },
  markAllText: { color: LUNA_COLORS.secondary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  list: { padding: spacing.xxl, paddingBottom: 80 },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...(shadows.sm as object),
  },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: LUNA_COLORS.secondary },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  cardMsg: { fontSize: fontSize.sm, color: LUNA_COLORS.textPrimary, marginTop: 4 },
  cardDate: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: spacing.sm },
});
