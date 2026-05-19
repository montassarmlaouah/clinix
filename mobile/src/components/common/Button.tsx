import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title:     string;
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?:    StyleProp<ViewStyle>;
}

// ── Configurations par variant ────────────────────────────────────────────────
const variantStyles: Record<
  ButtonVariant,
  { container: object; text: object; loaderColor: string; shadow?: object }
> = {
  primary: {
    container:   { backgroundColor: LUNA_COLORS.secondary, borderWidth: 0 },
    text:        { color: LUNA_COLORS.textInverse },
    loaderColor: LUNA_COLORS.textInverse,
    shadow:      shadows.button as object,
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth:     1.5,
      borderColor:     LUNA_COLORS.secondary,
    },
    text:        { color: LUNA_COLORS.secondary },
    loaderColor: LUNA_COLORS.secondary,
  },
  ghost: {
    container:   { backgroundColor: 'transparent', borderWidth: 0 },
    text:        { color: LUNA_COLORS.secondary },
    loaderColor: LUNA_COLORS.secondary,
  },
  danger: {
    container:   { backgroundColor: LUNA_COLORS.error, borderWidth: 0 },
    text:        { color: LUNA_COLORS.textInverse },
    loaderColor: LUNA_COLORS.textInverse,
    shadow:      {
      shadowColor: '#dc2626',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 12,
    },
  },
};

// ── Configurations par taille ─────────────────────────────────────────────────
const sizeConfig: Record<ButtonSize, { height: number; px: number; fs: number; loaderSize: number }> = {
  sm: { height: 40, px: spacing.lg,   fs: fontSize.sm,   loaderSize: 14 },
  md: { height: 48, px: spacing.xl,   fs: fontSize.base, loaderSize: 16 }, // ✨ hauteur 48px standard
  lg: { height: 52, px: spacing.xxl,  fs: fontSize.lg,   loaderSize: 18 },
};

// ── Composant ─────────────────────────────────────────────────────────────────
export function Button({
  title,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  style,
  onPress,
  ...rest
}: ButtonProps): React.JSX.Element {
  const vStyle = variantStyles[variant];
  const sConf  = sizeConfig[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        vStyle.container,
        {
          height:            sConf.height,
          paddingHorizontal: sConf.px,
          borderRadius:      borderRadius.full, // ✨ coins full pill
        },
        !isDisabled && vStyle.shadow,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.loaderColor} size={sConf.loaderSize} />
      ) : (
        <Text
          style={[
            styles.text,
            vStyle.text,
            {
              fontSize:   sConf.fs,
              fontWeight: fontWeight.bold,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    minWidth:       44,
  },
  text: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45, // ✨ disabled sans ombre
  },
});

export default Button;
