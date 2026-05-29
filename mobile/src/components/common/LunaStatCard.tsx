import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { IconTrendingUp, IconTrendingDown, type Icon as TablerIcon } from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';
import { resolveTablerIcon } from '@/src/utils/iconMapper';

interface LunaStatCardProps {
  label: string;
  value: string | number;
  icon?: string | TablerIcon;
  color?: string;
  bgColor?: string;
  trend?: 'up' | 'down' | null;
  onPress?: () => void;
  style?: ViewStyle;
}

export const LunaStatCard = React.memo(function LunaStatCard({
  label,
  value,
  icon,
  color = LUNA_COLORS.secondary,
  bgColor = LUNA_COLORS.surface,
  trend,
  onPress,
  style,
}: LunaStatCardProps): React.JSX.Element {
  const IconComponent = typeof icon === 'string' ? resolveTablerIcon(icon) : (icon ?? null);

  const cardStyle: ViewStyle = {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: color,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...shadows.sm,
  };

  const content = (
    <>
      {IconComponent ? (
        <View style={{ width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs, backgroundColor: `${color}18` }}>
          <IconComponent size={24} color={color} strokeWidth={1.8} />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        <Text style={{ ...typography.statValue, marginTop: spacing.xs }}>{value}</Text>
        {trend ? (
          trend === 'up' ? (
            <IconTrendingUp size={16} color={LUNA_COLORS.success} strokeWidth={2} />
          ) : (
            <IconTrendingDown size={16} color={LUNA_COLORS.danger} strokeWidth={2} />
          )
        ) : null}
      </View>
      <Text style={{ fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.medium }}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[cardStyle, style]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {content}
    </View>
  );
});
