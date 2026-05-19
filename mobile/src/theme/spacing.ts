import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// ── Espacements ───────────────────────────────────────────────────────────────
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
} as const;

// ── Rayons de bordure ─────────────────────────────────────────────────────────
export const borderRadius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  28,
  full: 999,
} as const;

// ── Ombres (iOS + Android) — douces, multicouche HeroUI ─────────────────────
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#26658c',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#26658c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#26658c',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#0d2336',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 16 },
  }),
  button: Platform.select({
    ios: {
      shadowColor: '#2d9cdb',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#26658c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: { elevation: 3 },
  }),
} as const;

// ── Dimensions écran ──────────────────────────────────────────────────────────
export const screen = {
  width,
  height,
  paddingHorizontal: 24,
  headerHeight:      60,
  tabBarHeight:      72,
} as const;

// ── Tailles d'icônes ──────────────────────────────────────────────────────────
export const iconSize = {
  xs:  16,
  sm:  20,
  md:  24,
  lg:  32,
  xl:  48,
  xxl: 64,
} as const;
