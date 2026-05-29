import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text, View } from 'react-native';
import {
  IconCalendar,
  IconClipboardList,
  IconDashboard,
  IconFileText,
  IconHome,
  IconPackage,
  IconPill,
  IconReportMedical,
  IconUsers,
  type Icon as TablerIcon,
  type IconProps,
} from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius } from '@/src/theme/spacing';
import { TAB_ICON_SIZE } from '@/src/theme/tabBar';

const ICON_MAP: Record<string, TablerIcon> = {
  home: IconHome,
  users: IconUsers,
  calendar: IconCalendar,
  fileText: IconFileText,
  clipboard: IconClipboardList,
  pill: IconPill,
  package: IconPackage,
  dashboard: IconDashboard,
  reportMedical: IconReportMedical,
};

const ICON_SIZE = TAB_ICON_SIZE;

interface TabBarIconProps {
  icon: TablerIcon;
  color: string;
  size?: number;
  focused?: boolean;
  badge?: number;
}

export function TabBarIcon({
  icon: Icon,
  color,
  size = ICON_SIZE,
  focused = false,
  badge = 0,
}: TabBarIconProps): React.JSX.Element {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
        backgroundColor: focused ? LUNA_COLORS.tabActiveBg : 'transparent',
      }}
    >
      <Icon size={size} color={color} strokeWidth={1.8} />
      {badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            borderRadius: borderRadius.full,
            backgroundColor: LUNA_COLORS.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
            borderWidth: 1.5,
            borderColor: LUNA_COLORS.surface,
          }}
        >
          <Text style={{ color: LUNA_COLORS.textInverse, fontSize: 9, fontWeight: '700' }}>
            {badge > 9 ? '9+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function createTabBarIcon(
  iconKey: keyof typeof ICON_MAP,
  options?: { badge?: number },
): NonNullable<BottomTabNavigationOptions['tabBarIcon']> {
  const Icon = ICON_MAP[iconKey] ?? IconHome;
  const badge = options?.badge ?? 0;
  return ({ color, focused }) => (
    <TabBarIcon
      icon={Icon}
      color={focused ? LUNA_COLORS.secondary : color}
      focused={focused}
      badge={badge}
    />
  );
}

export type TabIconName = keyof typeof ICON_MAP;
