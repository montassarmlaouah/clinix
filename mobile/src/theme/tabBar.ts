import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LUNA_COLORS } from '@/src/theme/colors';

/** Icônes barre du bas — compact mobile */
export const TAB_ICON_SIZE = 24;

/** Style d'onglets LUNA — 2–3 icônes, actif blanc, inactif atténué */
export function lunaTabBarOptions(): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarShowLabel: false,
    tabBarActiveTintColor: '#FFFFFF',
    tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
    tabBarStyle: {
      backgroundColor: LUNA_COLORS.secondary,
      borderTopWidth: 0,
      height: 52,
      paddingTop: 4,
      paddingBottom: 6,
    },
    tabBarItemStyle: {
      paddingVertical: 2,
      maxWidth: 120,
    },
  };
}

/** Options avec zone sûre (hauteur barre adaptée au mobile) */
export function useLunaTabBarOptions(): BottomTabNavigationOptions {
  const insets = useSafeAreaInsets();
  const base = lunaTabBarOptions();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);
  return {
    ...base,
    tabBarStyle: {
      ...(base.tabBarStyle as object),
      height: 48 + bottomPad,
      paddingBottom: bottomPad,
      paddingTop: 6,
    },
  };
}

/** @deprecated Utiliser useLunaTabBarOptions */
export const ROLE_TAB_ACCENT: Record<string, string> = {
  ROLE_SUPER_ADMIN: LUNA_COLORS.primary,
  ROLE_ADMIN_CLINIQUE: LUNA_COLORS.primary,
  ROLE_SECRETAIRE: LUNA_COLORS.secondary,
  ROLE_MEDECIN: LUNA_COLORS.secondary,
  ROLE_INFIRMIER: LUNA_COLORS.secondary,
  ROLE_RADIOLOGUE: LUNA_COLORS.secondary,
  ROLE_PHARMACIEN: LUNA_COLORS.accentGold,
  ROLE_PATIENT: LUNA_COLORS.info,
  ROLE_CHEF_PERSONNEL: LUNA_COLORS.tertiary,
  ROLE_TECHNICIEN_MAINTENANCE: LUNA_COLORS.warning,
};
