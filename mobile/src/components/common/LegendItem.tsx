import React from 'react';
import { Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

interface LegendItemProps {
  color: string;
  label: string;
  value?: string | number;
}

export const LegendItem = React.memo(function LegendItem({ color, label, value }: LegendItemProps): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
      <View style={{ width: 10, height: 10, borderRadius: borderRadius.full, backgroundColor: color }} />
      <Text style={{ flex: 1, fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary }}>{label}</Text>
      {value !== undefined ? (
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color }}>{value}</Text>
      ) : null}
    </View>
  );
});
