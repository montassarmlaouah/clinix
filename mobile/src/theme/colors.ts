// ✨ Palette Luna — Inspirée de HeroUI v3
export const LUNA_COLORS = {
  // ── Primaires (teals & blues méditerranéens) ────────────────────────────────
  primary:       '#26658c',   // Teal-bleu profond
  secondary:     '#2d9cdb',   // Bleu médium
  tertiary:      '#4ecdc4',   // Teal accent

  // ── Fond et surfaces ────────────────────────────────────────────────────────
  background:    '#f0f6fb',   // Bleu très clair (background page)
  surface:       '#ffffff',   // Blanc pur (cartes, modales)
  surfaceLight:  '#e8f3fa',   // Bleu très clair (bg secondaire)
  surfaceActive: '#daeef8',   // Bleu clair (hover/active)
  inputBg:       '#f4f9fd',   // Input focus — bleu très clair

  // ── Textes ──────────────────────────────────────────────────────────────────
  textPrimary:   '#0d2336',   // Très sombre (texte principal)
  textSecondary: '#4a6f8a',   // Gris-bleu (labels, descriptions)
  textDisabled:  '#9ca3af',   // Gris moyen (disabled)
  textInverse:   '#ffffff',   // Blanc (sur fond sombre)
  text:          '#0d2336',

  // ── Statuts ──────────────────────────────────────────────────────────────────
  success:       '#16a34a',   // Vert succès
  successLight:  '#dcfce7',   // Fond vert clair
  error:         '#dc2626',   // Rouge danger
  errorLight:    '#fee2e2',   // Fond rouge clair
  warning:       '#d97706',   // Orange warning
  warningLight:  '#fef3c7',   // Fond orange clair
  info:          '#0284c7',   // Bleu info
  infoLight:     '#e0f2fe',   // Fond bleu clair
  danger:        '#dc2626',   // Alias pour error

  // ── Bordures & séparateurs (subtiles HeroUI) ────────────────────────────────
  border:        '#c5dcea',           // Bordure standard
  borderSubtle:  'rgba(38, 101, 140, 0.12)',    // Bordure très discrète
  borderInput:   'rgba(38, 101, 140, 0.25)',    // Bordure input
  borderFocus:   'rgba(45, 156, 219, 0.15)',    // Glow focus
  borderStrong:  '#a8c5d9',

  // ── Overlay & interaction ────────────────────────────────────────────────────
  overlay:       'rgba(1, 28, 64, 0.45)',       // Overlay modal sombre
  dark:          '#1a4a66',                      // Sombre
  darkest:       '#0d2336',                      // Le plus sombre

  // ── Navigation ──────────────────────────────────────────────────────────────
  tabInactive:   '#9ca3af',                      // Icône inactive grise
  tabActiveBg:   'rgba(45, 156, 219, 0.12)',    // Fond tab actif subtle

  // ── Lumière secondaire ───────────────────────────────────────────────────────
  secondaryLight: 'rgba(45, 156, 219, 0.1)',    // Bleu très clair
  accentGold:     '#f59e0b',                     // Or/amber
  accentOrange:   '#f59e0b',                     // Orange
} as const;

export type LunaColor = keyof typeof LUNA_COLORS;
