import React from 'react';
import { Text, View } from 'react-native';
import { IconArrowDown, IconArrowUp, type IconProps } from '@tabler/icons-react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

type TablerIconComponent = React.FC<IconProps>;

interface StatCardProps {
  value: string | number;
  label: string;
  icon: TablerIconComponent;
  circleColor: string;
  iconColor: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export const StatCard = React.memo(function StatCard({
  value,
  label,
  icon: Icon,
  circleColor,
  iconColor,
  trend,
  trendValue,
}: StatCardProps): React.JSX.Element {
  return (
    <View
      style={{
        backgroundColor: LUNA_COLORS.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: LUNA_COLORS.borderSubtle,
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <View style={{ width: 44, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: circleColor }}>
          <Icon size={20} color={iconColor} strokeWidth={1.8} />
        </View>
        {trend && trendValue && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {trend === 'up' ? (
              <IconArrowUp size={12} color={LUNA_COLORS.success} strokeWidth={2} />
            ) : (
              <IconArrowDown size={12} color={LUNA_COLORS.danger} strokeWidth={2} />
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: trend === 'up' ? LUNA_COLORS.success : LUNA_COLORS.danger,
              }}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.statValue, fontSize: 24 }}>{value}</Text>
        <Text style={{ fontSize: 12, color: LUNA_COLORS.textSecondary }}>{label}</Text>
      </View>
    </View>
  );
});
