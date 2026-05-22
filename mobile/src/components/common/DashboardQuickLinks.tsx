import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getRoleMenu, type RoleMenuItem } from '@/src/constants/roleMenus';
import { getRoleTabRoutes } from '@/src/constants/roleTabs';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface DashboardQuickLinksProps {
  maxItems?: number;
  excludeRoutes?: string[];
  /** Routes affichées en priorité (ex. navigation principale admin). */
  pinnedRoutes?: readonly string[];
  /** Couleur de la bordure gauche des tuiles */
  accentColor?: string;
}

export function DashboardQuickLinks({
  maxItems = 12,
  excludeRoutes = [],
  pinnedRoutes,
  accentColor = LUNA_COLORS.secondary,
}: DashboardQuickLinksProps): React.JSX.Element | null {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const menu = getRoleMenu(role, { estCabinet, accesCabinet, cliniqueId });
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
            accentColor={accentColor}
            onPress={() => router.push(item.route as never)}
          />
        ))}
      </View>
    </View>
  );
}

function QuickTile({
  item,
  accentColor,
  onPress,
}: {
  item: RoleMenuItem;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tile, { borderLeftColor: accentColor }]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={24} color={LUNA_COLORS.secondary} />
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
    ...typography.sectionTitle,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '30%',
    minWidth: 100,
    backgroundColor: LUNA_COLORS.surfaceLight, // ✨ fond surfaceLight
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderLeftWidth: 4, // ✨ bordure colorée gauche
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
    lineHeight: 15,
  },
});
