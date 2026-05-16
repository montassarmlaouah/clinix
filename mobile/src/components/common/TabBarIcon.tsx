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

/** Icône onglet : contour si inactif, plein + blanc si actif */
export function createTabBarIcon(
  outline: TabIconName,
  options?: { filled?: TabIconName; badge?: number },
): NonNullable<BottomTabNavigationOptions['tabBarIcon']> {
  const filled = options?.filled ?? ICON_FILLED[outline] ?? outline;
  const badge = options?.badge;
  return ({ color, focused }) => (
    <TabBarIcon
      name={focused ? filled : outline}
      color={color}
      focused={focused}
      badge={badge}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapFocused: {
    transform: [{ scale: 1.08 }],
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: LUNA_COLORS.textInverse,
    fontSize: 8,
    fontWeight: '700',
  },
});
