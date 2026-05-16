import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getRoleMenu, type RoleMenuItem } from '@/src/constants/roleMenus';
import { getRoleTabRoutes } from '@/src/constants/roleTabs';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface DashboardQuickLinksProps {
  maxItems?: number;
  excludeRoutes?: string[];
  /** Routes affichées en priorité (ex. navigation principale admin). */
  pinnedRoutes?: readonly string[];
}

export function DashboardQuickLinks({
  maxItems = 12,
  excludeRoutes = [],
  pinnedRoutes,
}: DashboardQuickLinksProps): React.JSX.Element | null {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const menu = getRoleMenu(role, { estCabinet, cliniqueId });
  const tabRoutes = getRoleTabRoutes(role);

  let items: RoleMenuItem[];

  if (pinnedRoutes?.length) {
    items = pinnedRoutes
      .map((route) => menu.find((i) => i.route === route))
      .filter((i): i is RoleMenuItem => !!i);
  } else {
    items = menu.filter(
      (i) =>
        !tabRoutes.includes(i.route) &&
        !excludeRoutes.includes(i.route) &&
        !i.route.endsWith('/menu') &&
        !i.route.includes('/profil'),
    );
  }

  if (items.length === 0) return null;

  const shown = items.slice(0, maxItems);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Accès rapide</Text>
      <View style={styles.grid}>
        {shown.map((item) => (
          <QuickTile
            key={item.route}
            item={item}
            onPress={() => router.push(item.route as never)}
          />
        ))}
      </View>
    </View>
  );
}

function QuickTile({ item, onPress }: { item: RoleMenuItem; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={20} color={LUNA_COLORS.secondary} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '30%',
    minWidth: 96,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 10,
    color: LUNA_COLORS.dark,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
    lineHeight: 13,
  },
});
