// ── Chart Colors — Luna palette ──────────────────────────────────────────────
export const CHART_COLORS = {
  primary:    '#2d9cdb',
  secondary:  '#26658c',
  tertiary:   '#4ecdc4',

  success:    '#16a34a',
  warning:    '#d97706',
  error:      '#dc2626',

  purple:     '#7c3aed',
  pink:       '#db2777',
  orange:     '#ea580c',
  indigo:     '#4338ca',

  background: '#ffffff',
  gridLines:  'rgba(38, 101, 140, 0.08)',
  axisText:   '#4a6f8a',
} as const;

// Palette tournante pour graphes multi-séries
export const CHART_PALETTE: readonly string[] = [
  CHART_COLORS.primary,
  CHART_COLORS.tertiary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.orange,
  CHART_COLORS.indigo,
];
