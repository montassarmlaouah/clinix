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
    fontSize:   36,
    fontWeight: '700',
    color:      LUNA_COLORS.darkest,
    lineHeight: 43,
  },
  h2: {
    fontSize:   28,
    fontWeight: '700',
    color:      LUNA_COLORS.darkest,
  },
  h3: {
    fontSize:   22,
    fontWeight: '600',
    color:      LUNA_COLORS.dark,
  },
  h4: {
    fontSize:   18,
    fontWeight: '600',
    color:      LUNA_COLORS.textPrimary,
  },
  body: {
    fontSize:   16,
    fontWeight: '400',
    color:      LUNA_COLORS.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize:   14,
    fontWeight: '400',
    color:      LUNA_COLORS.textSecondary,
  },
  caption: {
    fontSize:   12,
    fontWeight: '400',
    color:      LUNA_COLORS.textSecondary,
  },
  label: {
    fontSize:   13,
    fontWeight: '500',
    color:      LUNA_COLORS.textPrimary,
  },
  button: {
    fontSize:   16,
    fontWeight: '600',
    color:      LUNA_COLORS.textInverse,
  },
  buttonSm: {
    fontSize:   14,
    fontWeight: '500',
    color:      LUNA_COLORS.textInverse,
  },
};
