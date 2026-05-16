import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface LunaStatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  bgColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function LunaStatCard({
  label,
  value,
  icon,
  color = LUNA_COLORS.secondary,
  bgColor = LUNA_COLORS.surface,
  onPress,
  style,
}: LunaStatCardProps): React.JSX.Element {
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={24} color={color} /> : null}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: bgColor, borderTopColor: color }, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderTopColor: color }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 3,
    ...(shadows.sm as object),
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },
});
