import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

interface LunaStatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  bgColor?: string;
  trend?: 'up' | 'down' | null;
  onPress?: () => void;
  style?: ViewStyle;
}

export function LunaStatCard({
  label,
  value,
  icon,
  color = LUNA_COLORS.secondary,
  bgColor = LUNA_COLORS.surface,
  trend,
  onPress,
  style,
}: LunaStatCardProps): React.JSX.Element {
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      ) : null}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {trend ? (
          <Text style={[styles.trend, trend === 'up' ? styles.trendUp : styles.trendDown]}>
            {trend === 'up' ? '↑' : '↓'}
          </Text>
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: bgColor, borderLeftColor: color }, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderLeftColor: color }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderLeftWidth: 4, // ✨ bordure colorée gauche
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    ...typography.statValue,
    marginTop: spacing.xs,
  },
  trend: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  trendUp: { color: LUNA_COLORS.success },
  trendDown: { color: LUNA_COLORS.error },
  label: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
