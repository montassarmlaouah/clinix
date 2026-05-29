import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';

interface LunaCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accentColor?: string;
  style?: ViewStyle;
}

export const LunaCard = React.memo(function LunaCard({
  children,
  onPress,
  accentColor = LUNA_COLORS.secondary,
  style,
}: LunaCardProps): React.JSX.Element {
  // ✨ Carte Luna HeroUI : coins très arrondis, ombre douce, accent left 4px
  const cardStyle: ViewStyle = {
    backgroundColor: LUNA_COLORS.surface, // ✨ Blanc pur
    borderRadius: borderRadius.xl, // ✨ 24px arrondi
    padding: spacing.xl,
    marginBottom: spacing.lg,
    // ✨ Accent bar left (4px coloré)
    borderLeftWidth: 4,
    borderLeftColor: accentColor,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨ Bordure subtle
    ...(shadows.md as object), // ✨ Ombre douce multicouche (md)
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && {
            backgroundColor: LUNA_COLORS.surfaceActive, // ✨ Bleu clair au press
            opacity: 0.9,
          },
          style,
        ]}
        android_ripple={{ color: LUNA_COLORS.surfaceActive }}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
});
