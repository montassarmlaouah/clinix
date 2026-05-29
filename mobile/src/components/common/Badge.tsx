import React from 'react';
import { Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export type BadgeColor = 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'default' | 'error';

export interface BadgeProps {
  label: string;
  color?: BadgeColor;
  showDot?: boolean;
}

// ✨ Palette badges HeroUI v3 (fond clair + texte foncé)
const colorMap: Record<BadgeColor, { background: string; text: string; dot: string }> = {
  success: {
    background: LUNA_COLORS.successLight, // ✨ #dcfce7
    text: LUNA_COLORS.success,             // ✨ #16a34a
    dot: LUNA_COLORS.success,
  },
  danger: {
    background: LUNA_COLORS.errorLight, // ✨ #fee2e2
    text: LUNA_COLORS.danger,            // ✨ #dc2626
    dot: LUNA_COLORS.danger,
  },
  error: {
    background: LUNA_COLORS.errorLight,
    text: LUNA_COLORS.danger,
    dot: LUNA_COLORS.danger,
  },
  warning: {
    background: LUNA_COLORS.warningLight, // ✨ #fef3c7
    text: LUNA_COLORS.warning,             // ✨ #d97706
    dot: LUNA_COLORS.warning,
  },
  info: {
    background: LUNA_COLORS.infoLight, // ✨ #e0f2fe
    text: LUNA_COLORS.info,             // ✨ #0284c7
    dot: LUNA_COLORS.info,
  },
  secondary: {
    background: 'rgba(45, 156, 219, 0.1)', // ✨ Bleu très clair
    text: LUNA_COLORS.secondary,            // ✨ #2d9cdb
    dot: LUNA_COLORS.secondary,
  },
  default: {
    background: LUNA_COLORS.surfaceLight,  // ✨ #e8f3fa
    text: LUNA_COLORS.textSecondary,        // ✨ #4a6f8a
    dot: LUNA_COLORS.textSecondary,
  },
};

export const Badge = React.memo(function Badge({ label, color = 'default', showDot = false }: BadgeProps): React.JSX.Element {
  const palette = colorMap[color];

  // ✨ Pill badge HeroUI : coins arrondis full, padding généreux
  const pillStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingVertical: 6, // ✨ Légèrement augmenté
    paddingHorizontal: 12,
    backgroundColor: palette.background,
    // ✨ Bordure subtle pour séparation
    borderWidth: 1,
    borderColor: palette.text + '20',
  };

  // ✨ Point indicateur (8px) coloré
  const dotStyle: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.dot,
    marginRight: 2,
  };

  // ✨ Texte badge : uppercase, bold, 11px
  const labelStyle: TextStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5, // ✨ Augmenté pour lisibilité
    includeFontPadding: false,
  };

  return (
    <View style={pillStyle}>
      {showDot ? <View style={dotStyle} /> : null}
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});
