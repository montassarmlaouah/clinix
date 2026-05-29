import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { IconPlus, type Icon as TablerIcon } from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius } from '@/src/theme/spacing';

export type LunaActionButtonSize = 'sm' | 'md';

const SIZES: Record<LunaActionButtonSize, { btn: number; icon: number }> = {
  sm: { btn: 28, icon: 14 },
  md: { btn: 32, icon: 16 },
};

export interface LunaActionButtonProps {
  icon: TablerIcon;
  onPress: () => void;
  disabled?: boolean;
  size?: LunaActionButtonSize;
  color?: string;
  style?: ViewStyle;
}

export const LunaActionButton = React.memo(function LunaActionButton({
  icon: Icon,
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
        {
          width: dim.btn,
          height: dim.btn,
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}1F`,
        },
        disabled && { opacity: 0.45 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Icon size={dim.icon} color={color} strokeWidth={1.8} />
    </Pressable>
  );
});
