import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface ListCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  accentColor?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function ListCard({
  title,
  subtitle,
  meta,
  accentColor = LUNA_COLORS.secondary,
  onPress,
  right,
  style,
}: ListCardProps): React.JSX.Element {
  const content = (
    <>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </>
  );

  const cardStyle = [styles.card, { borderLeftColor: accentColor }, style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={cardStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...(shadows.sm as object),
  },
  body: { flex: 1 },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.tertiary,
    marginTop: 4,
  },
  meta: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    marginTop: 4,
  },
  right: { marginLeft: spacing.sm },
});
