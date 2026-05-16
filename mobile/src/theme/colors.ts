export const LUNA_COLORS = {
  // ── Core palette ─────────────────────────────────────────────
  primary:       '#A7EBF2',   // bleu clair — fond splash / accents légers
  secondary:     '#54ACBF',   // bleu moyen — boutons, icônes actives
  tertiary:      '#26658C',   // bleu profond — bordures, éléments secondaires
  dark:          '#023859',   // bleu très foncé — textes forts
  darkest:       '#011C40',   // bleu nuit — titres principaux

  // ── Surfaces ─────────────────────────────────────────────────
  surface:       '#FFFFFF',
  background:    '#EBF4F6',
  surfaceLight:  '#E8F7F9',

  // ── Textes ───────────────────────────────────────────────────
  textPrimary:   '#1A3A52',
  textSecondary: '#023859',
  textDisabled:  '#BDBDBD',
  textInverse:   '#FFFFFF',

  // ── États sémantiques ─────────────────────────────────────────
  success:       '#4CAF50',
  successLight:  '#E8F5E9',
  error:         '#F44336',
  errorLight:    '#FFEBEE',
  warning:       '#FF9500',
  warningLight:  '#FFF3E0',
  info:          '#54ACBF',
  infoLight:     '#E3F4F7',
  secondaryLight:'#D6EDF2',

  // ── Accents ──────────────────────────────────────────────────
  accentOrange:  '#FF9500',
  accentGold:    '#FFB800',

  // ── Utilitaires ──────────────────────────────────────────────
  border:        'rgba(167,235,242,0.3)',
  borderDark:    'rgba(2,56,89,0.15)',
  overlay:       'rgba(1,28,64,0.5)',
} as const;

export type LunaColor = keyof typeof LUNA_COLORS;
