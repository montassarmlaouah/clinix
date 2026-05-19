import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';

interface LunaCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accentColor?: string;
  style?: ViewStyle;
}

export function LunaCard({
  children,
  onPress,
  accentColor = LUNA_COLORS.secondary,
  style,
}: LunaCardProps): React.JSX.Element {
  const cardStyle = [
    styles.card,
    { borderLeftColor: accentColor },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={cardStyle} android_ripple={{ color: LUNA_COLORS.surfaceActive }}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: 20, // ✨ coins très arrondis HeroUI
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨ bordure subtile
    borderLeftColor: LUNA_COLORS.secondary,
    ...(shadows.card as object),
  },
});
