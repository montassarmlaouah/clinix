import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CardProps {
  children:  React.ReactNode;
  style?:    StyleProp<ViewStyle>;
  onPress?:  () => void;
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }: CardProps): React.JSX.Element {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.md,
    padding:         spacing.lg,
    ...(shadows.md as object),
  },
});

export default Card;
