import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LUNA_COLORS } from '@/src/theme/colors';

export const TAB_ICON_SIZE = 24;

/** Masque un onglet — NE PAS ajouter tabBarButton ici (conflit avec href: null dans expo-router) */
export const hiddenTabScreenOptions: BottomTabNavigationOptions = {
  href: null,
  unmountOnBlur: true,
};

// ✨ Tab bar HeroUI v3 — fond blanc pur, icônes actives avec cercle subtil
export function lunaTabBarOptions(): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarShowLabel: true,
    tabBarActiveTintColor: LUNA_COLORS.secondary, // ✨ #2d9cdb bleu actif
    tabBarInactiveTintColor: LUNA_COLORS.tabInactive, // ✨ #9ca3af gris
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
    },
    // ✨ Tab bar HeroUI : fond blanc, ombre top douce
    tabBarStyle: {
      backgroundColor: LUNA_COLORS.surface, // ✨ Blanc pur
      borderTopWidth: 1,
      borderTopColor: LUNA_COLORS.borderSubtle, // ✨ Bordure très discrète
      height: 72, // ✨ Un peu plus haut pour HeroUI feel
      paddingTop: 8,
      paddingBottom: 8,
      // ✨ Ombre top douce (multicouche)
      elevation: 8,
      shadowColor: '#0d2336',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: -4 },
      shadowRadius: 12,
    },
    tabBarItemStyle: {
      paddingVertical: 4,
      justifyContent: 'center',
      alignItems: 'center',
      // ✨ Arrière-plan actif subtle avec cercle
      borderRadius: 16,
    },
  };
}

export function useLunaTabBarOptions(): BottomTabNavigationOptions {
  const insets = useSafeAreaInsets();
  const base = lunaTabBarOptions();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);
  return {
    ...base,
    tabBarStyle: {
      ...(base.tabBarStyle as object),
      height: 72 + bottomPad,
      paddingBottom: bottomPad,
      paddingTop: 8,
    },
  };
}

// ✨ Couleurs d'accent par rôle
export const ROLE_TAB_ACCENT: Record<string, string> = {
  ROLE_SUPER_ADMIN: LUNA_COLORS.primary,       // #26658c
  ROLE_ADMIN_CLINIQUE: LUNA_COLORS.primary,
  ROLE_SECRETAIRE: LUNA_COLORS.secondary,      // #2d9cdb
  ROLE_MEDECIN: LUNA_COLORS.secondary,
  ROLE_INFIRMIER: LUNA_COLORS.secondary,
  ROLE_RADIOLOGUE: LUNA_COLORS.secondary,
  ROLE_PHARMACIEN: LUNA_COLORS.accentGold,     // #f59e0b
  ROLE_PATIENT: LUNA_COLORS.info,              // #0284c7
  ROLE_CHEF_PERSONNEL: LUNA_COLORS.tertiary,   // #4ecdc4
  ROLE_TECHNICIEN_MAINTENANCE: LUNA_COLORS.warning, // #d97706
};
