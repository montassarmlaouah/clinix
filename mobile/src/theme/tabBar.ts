import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LUNA_COLORS } from '@/src/theme/colors';

/** Icônes barre du bas */
export const TAB_ICON_SIZE = 26;

/**
 * Masque un onglet sans `href` (expo-router interdit `href` + `tabBarButton` ensemble ;
 * les routes internes ont déjà un `tabBarButton` injecté par le routeur).
 */
export const hiddenTabScreenOptions: BottomTabNavigationOptions = {
  tabBarItemStyle: { display: 'none', width: 0, height: 0 },
  tabBarButton: () => null,
};

/** Barre du bas — fond blanc, ombre top, icône active secondary + fond circulaire */
export function lunaTabBarOptions(): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarShowLabel: false,
    tabBarActiveTintColor: LUNA_COLORS.secondary,
    tabBarInactiveTintColor: LUNA_COLORS.tabInactive,
    tabBarStyle: {
      backgroundColor: LUNA_COLORS.surface, // ✨ fond blanc pur
      borderTopWidth: 0,
      height: 68,
      paddingTop: 8,
      paddingBottom: 8,
      elevation: 12,
      shadowColor: '#26658c',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: -4 },
      shadowRadius: 12,
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
      height: 64 + bottomPad, // ✨ hauteur 64–72px avec safe area
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
