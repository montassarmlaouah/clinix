import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius } from '@/src/theme/spacing';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

/** Aligné adminTable actionBtn : 32px rond, fond semi-transparent. */
export type LunaActionButtonSize = 'sm' | 'md';

const SIZES: Record<LunaActionButtonSize, { btn: number; icon: number }> = {
  sm: { btn: 28, icon: 14 },
  md: { btn: 32, icon: 16 },
};

export interface LunaActionButtonProps {
  icon: IonIcon;
  onPress: () => void;
  disabled?: boolean;
  size?: LunaActionButtonSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Bouton d'action icône rond (tableaux admin). */
export function LunaActionButton({
  icon,
  onPress,
  disabled = false,
  size = 'md',
  color = LUNA_COLORS.secondary,
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
          backgroundColor: `${color}1F`, // ✨ fond semi-transparent
        },
        disabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={dim.icon} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
