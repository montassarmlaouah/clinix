import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LUNA_COLORS } from '@/src/theme/colors';

/** Icônes barre du bas (×2, centrées) */
export const TAB_ICON_SIZE = 48;

/**
 * Masque un onglet sans `href` (expo-router interdit `href` + `tabBarButton` ensemble ;
 * les routes internes ont déjà un `tabBarButton` injecté par le routeur).
 */
export const hiddenTabScreenOptions: BottomTabNavigationOptions = {
  tabBarItemStyle: { display: 'none', width: 0, height: 0 },
  tabBarButton: () => null,
};

/** Barre du bas — fond clair, icône active en teal (comme maquette mobile) */
export function lunaTabBarOptions(): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarShowLabel: false,
    tabBarActiveTintColor: LUNA_COLORS.secondary,
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: {
      backgroundColor: '#F8FAFB',
      borderTopWidth: 1,
      borderTopColor: 'rgba(2,56,89,0.08)',
      height: 64,
      paddingTop: 6,
      paddingBottom: 6,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 8,
    },
    tabBarItemStyle: {
      paddingVertical: 4,
      justifyContent: 'center',
      alignItems: 'center',
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
      height: 56 + bottomPad,
      paddingBottom: bottomPad,
      paddingTop: 8,
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
