import React from 'react';
import { TouchableOpacity, View, type TouchableOpacityProps, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card = React.memo(function Card({ children, style, onPress }: CardProps): React.JSX.Element {
  // ✨ Carte HeroUI : coins très arrondis (20px), ombre douce, bordure subtle
  const cardStyle: ViewStyle = {
    backgroundColor: LUNA_COLORS.surface, // ✨ Blanc pur
    borderRadius: borderRadius.xl, // ✨ 24px arrondi
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨ Bordure très discrète
    ...(shadows.md as object), // ✨ Ombre douce multicouche
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75} // ✨ HeroUI activeOpacity
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
});

export default Card;
