import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

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

export const ListCard = React.memo(function ListCard({
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
  const cardStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)',
    ...(statusBar !== 'none' ? {} : { borderLeftColor: accentColor, borderLeftWidth: 4 }),
  };

  const content = (
    <>
      {left ? <View style={{ marginRight: spacing.md }}>{left}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest }} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: fontSize.sm, color: LUNA_COLORS.tertiary, marginTop: 4 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={{ fontSize: fontSize.xs, color: accentColor, marginTop: 4 }} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {right ? <View style={{ marginLeft: spacing.sm }}>{right}</View> : null}
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.lg + 36,
            backgroundColor: LUNA_COLORS.secondary,
            borderRadius: borderRadius.full,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse }}>{badge}</Text>
        </View>
      ) : null}
      {statusBar !== 'none' ? (
        <View
          style={{
            width: 4,
            alignSelf: 'stretch',
            borderRadius: borderRadius.sm,
            marginLeft: spacing.xs,
            backgroundColor: statusBar === 'alert' ? LUNA_COLORS.danger : LUNA_COLORS.borderDark,
          }}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[cardStyle, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{content}</View>;
});
