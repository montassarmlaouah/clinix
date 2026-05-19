import { TextStyle } from 'react-native';

import { LUNA_COLORS } from './colors';

// ── Familles de polices ───────────────────────────────────────────────────────
export const fontFamily = {
  regular: 'System',
  medium:  'System',
  bold:    'System',
} as const;

// ── Tailles ───────────────────────────────────────────────────────────────────
export const fontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  base: 16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,
  huge: 48,
} as const;

// ── Graisses ──────────────────────────────────────────────────────────────────
export const fontWeight = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
} as const;

// ── Hauteurs de ligne (multiplicateurs) ──────────────────────────────────────
export const lineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,
  loose:   2.0,
} as const;

// ── Styles composites prêts à l'emploi ───────────────────────────────────────
export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize:   fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.darkest,
    lineHeight: 43,
  },
  h2: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.darkest,
  },
  h3: {
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.dark,
  },
  h4: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textPrimary,
  },
  body: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.regular,
    color:      LUNA_COLORS.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.regular,
    color:      LUNA_COLORS.textSecondary,
  },
  caption: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.regular,
    color:      LUNA_COLORS.textSecondary,
  },
  label: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.textSecondary,
  },
  // ✨ Titres de section HeroUI — uppercase, letterSpacing
  sectionTitle: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.semibold,
    color:         LUNA_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.darkest,
  },
  button: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.textInverse,
  },
  buttonSm: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textInverse,
  },
};
