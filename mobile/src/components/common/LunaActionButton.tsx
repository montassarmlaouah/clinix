import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

/** Aligné web `btn-action` : 36px ; `sm` = 50 % (compact). */
export type LunaActionButtonSize = 'sm' | 'md';

const SIZES: Record<LunaActionButtonSize, { btn: number; icon: number; radius: number }> = {
  sm: { btn: 32, icon: 16, radius: 6 },
  md: { btn: 36, icon: 18, radius: 8 },
};

export interface LunaActionButtonProps {
  icon: IonIcon;
  onPress: () => void;
  disabled?: boolean;
  size?: LunaActionButtonSize;
  style?: StyleProp<ViewStyle>;
}

/** Bouton d’action carré bleu foncé (aligné web `btn-action`). */
export function LunaActionButton({
  icon,
  onPress,
  disabled = false,
  size = 'md',
  style,
}: LunaActionButtonProps): React.JSX.Element {
  const dim = SIZES[size];
  return (
    <Pressable
      style={[
        styles.btn,
        {
          width: dim.btn,
          height: dim.btn,
          borderRadius: dim.radius,
        },
        disabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={dim.icon} color={LUNA_COLORS.textInverse} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: LUNA_COLORS.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: LUNA_COLORS.borderDark,
    opacity: 0.6,
  },
});
