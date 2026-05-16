import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
export type BadgeColor = 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default';

export interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

// ── Palette par couleur ───────────────────────────────────────────────────────
const colorMap: Record<BadgeColor, { background: string; text: string }> = {
  success:  { background: LUNA_COLORS.successLight,  text: LUNA_COLORS.success  },
  error:    { background: LUNA_COLORS.errorLight,    text: LUNA_COLORS.error    },
  warning:  { background: LUNA_COLORS.warningLight,  text: LUNA_COLORS.warning  },
  info:     { background: LUNA_COLORS.infoLight,     text: LUNA_COLORS.info     },
  secondary:{ background: LUNA_COLORS.secondaryLight,text: LUNA_COLORS.secondary},
  default:  { background: LUNA_COLORS.surfaceLight,  text: LUNA_COLORS.textSecondary },
};

// ── Composant ─────────────────────────────────────────────────────────────────
export function Badge({ label, color = 'default' }: BadgeProps): React.JSX.Element {
  const palette = colorMap[color];

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  pill: {
    alignSelf:         'flex-start',
    borderRadius:      borderRadius.full,
    paddingVertical:   spacing.xs / 2,   // 2
    paddingHorizontal: spacing.sm,       // 8
  },
  label: {
    fontSize:           fontSize.xs,
    fontWeight:         fontWeight.medium,
    includeFontPadding: false,
  },
});

export default Badge;
