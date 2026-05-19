import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize } from '@/src/theme/typography';

interface LegendItemProps {
  color: string;
  label: string;
  value?: string | number;
}

export function LegendItem({ color, label, value }: LegendItemProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      {value !== undefined ? (
        <Text style={[styles.value, { color }]}>{value}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
    marginBottom:  spacing.xs,
  },
  dot: {
    width:        10,
    height:       10,
    borderRadius: borderRadius.full,
  },
  label: {
    flex:      1,
    fontSize:  fontSize.sm,
    color:     LUNA_COLORS.textSecondary,
  },
  value: {
    fontSize:  fontSize.sm,
    fontWeight: '600',
  },
});
