// src/theme/colors.ts  — LUNA palette, light-only (HeroUI v3 inspired)
export const LUNA_COLORS = {
  // Backgrounds
  background:    '#f0f6fb',
  surface:       '#ffffff',
  surfaceLight:  '#e8f3fa',
  surfaceActive: '#daeef8',

  // Brand
  primary:    '#26658c',
  secondary:  '#2d9cdb',
  tertiary:   '#4ecdc4',
  secondaryLight: '#e0f2fe', // ✨ fond léger badges/états secondaires
  accentGold: '#d97706',     // ✨ accent pharmacien / alertes dorées

  // Text
  textPrimary:   '#0d2336',
  textSecondary: '#4a6f8a',
  textDisabled:  '#9ab8cc',
  textInverse:   '#ffffff',

  // Status
  success:      '#16a34a',
  successLight: '#dcfce7',
  error:        '#dc2626',
  errorLight:   '#fee2e2',
  warning:      '#d97706',
  warningLight: '#fef3c7',
  info:         '#0284c7',
  infoLight:    '#e0f2fe',

  // UI elements
  border:       '#c5dcea',
  borderStrong: '#93bdd4',
  borderDark:   '#c5dcea', // ✨ alias rétrocompat — séparateurs subtils
  dark:         '#1a4a66',
  darkest:      '#0d2336',
  inputBg:      '#f4f9fd',

  // ✨ Bordures semi-transparentes (cartes, inputs HeroUI)
  borderSubtle: 'rgba(38, 101, 140, 0.12)',
  borderInput:  'rgba(38, 101, 140, 0.25)',
  borderFocus:  'rgba(45, 156, 219, 0.15)',
  overlay:      'rgba(1, 28, 64, 0.45)',
  tabInactive:  '#9CA3AF',
  tabActiveBg:  'rgba(45, 156, 219, 0.12)',
} as const;

export type LunaColor = keyof typeof LUNA_COLORS;
