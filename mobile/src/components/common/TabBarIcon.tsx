import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RoleMenuIcon } from '@/src/constants/roleMenus';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius } from '@/src/theme/spacing';
import { TAB_ICON_SIZE } from '@/src/theme/tabBar';

export type TabIconName = ComponentProps<typeof Ionicons>['name'];

const ICON_FILLED: Partial<Record<TabIconName, TabIconName>> = {
  'home-outline': 'home',
  'grid-outline': 'grid',
  'people-outline': 'people',
  'person-outline': 'person',
  'calendar-outline': 'calendar',
  'chatbubbles-outline': 'chatbubbles',
  'time-outline': 'time',
  'document-text-outline': 'document-text',
  'medical-outline': 'medical',
  'construct-outline': 'construct',
  'bed-outline': 'bed',
  'flask-outline': 'flask',
  'card-outline': 'card',
  'business-outline': 'business',
  'speedometer-outline': 'speedometer',
  'clipboard-outline': 'clipboard',
  'checkmark-circle-outline': 'checkmark-circle',
  'medkit-outline': 'medkit',
  'folder-open-outline': 'folder-open',
  'warning-outline': 'warning',
  'stats-chart-outline': 'stats-chart',
  'person-circle-outline': 'person-circle',
};

interface TabBarIconProps {
  name: RoleMenuIcon;
  color: string;
  size?: number;
  focused?: boolean;
  badge?: number;
}

export function TabBarIcon({
  name,
  color,
  size = TAB_ICON_SIZE,
  focused = false,
  badge = 0,
}: TabBarIconProps): React.JSX.Element {
  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Ionicons name={name} size={size} color={color} />
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export interface CreateTabBarIconOptions {
  filled?: TabIconName;
  badge?: number;
  /** Même rendu que l'accès rapide : toujours l'icône outline (évite les glyphes manquants sur web). */
  outlineOnly?: boolean;
}

/** Icône onglet — par défaut outline seul (comme accès rapide). */
export function createTabBarIcon(
  outline: TabIconName,
  options?: CreateTabBarIconOptions,
): NonNullable<BottomTabNavigationOptions['tabBarIcon']> {
  const outlineOnly = options?.outlineOnly !== false;
  const filled = options?.filled ?? ICON_FILLED[outline] ?? outline;
  const badge = options?.badge;
  return ({ color, focused }) => (
    <TabBarIcon
      name={outlineOnly || !focused ? outline : filled}
      color={color}
      focused={focused}
      badge={badge}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  wrapFocused: {
    backgroundColor: LUNA_COLORS.tabActiveBg, // ✨ fond circulaire semi-transparent
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.surface,
  },
  badgeText: {
    color: LUNA_COLORS.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
});
