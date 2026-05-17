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
  left?: React.ReactNode;
  badge?: string;
  statusBar?: 'alert' | 'muted' | 'none';
  style?: ViewStyle;
}

export function ListCard({
  title,
  subtitle,
  meta,
  accentColor = LUNA_COLORS.secondary,
  onPress,
  right,
  left,
  badge,
  statusBar = 'none',
  style,
}: ListCardProps): React.JSX.Element {
  const content = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.meta, { color: accentColor }]} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{badge}</Text>
        </View>
      ) : null}
      {statusBar !== 'none' ? (
        <View
          style={[
            styles.statusBar,
            statusBar === 'alert' ? styles.statusBarAlert : styles.statusBarMuted,
          ]}
        />
      ) : null}
    </>
  );

  const cardStyle = [
    styles.card,
    statusBar === 'none' ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : styles.cardFlat,
    style,
  ];

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
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    marginBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  cardFlat: {
    borderLeftWidth: 0,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 0,
    ...(shadows.sm as object),
  },
  left: { marginRight: spacing.md },
  body: { flex: 1, minWidth: 0 },
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
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg + 36,
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  statusBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  statusBarMuted: { backgroundColor: LUNA_COLORS.borderDark },
  statusBarAlert: { backgroundColor: LUNA_COLORS.error },
});
