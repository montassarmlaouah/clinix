import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, type TouchableOpacityProps, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export type ButtonVariant = 'solid' | 'bordered' | 'light' | 'ghost' | 'danger' | 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

// ✨ Configuration variants HeroUI v3
const variantConfig: Record<ButtonVariant, { container: ViewStyle; text: { color: string }; loaderColor: string }> = {
  // ── Primaire (fond secondary #2d9cdb avec ombre colorée) ──────────────────
  primary: {
    container: { backgroundColor: LUNA_COLORS.secondary, borderWidth: 0, ...shadows.button },
    text: { color: LUNA_COLORS.textInverse },
    loaderColor: LUNA_COLORS.textInverse,
  },
  // ── Solide (alias primary) ──────────────────────────────────────────────
  solid: {
    container: { backgroundColor: LUNA_COLORS.secondary, borderWidth: 0, ...shadows.button },
    text: { color: LUNA_COLORS.textInverse },
    loaderColor: LUNA_COLORS.textInverse,
  },
  // ── Secondaire (alternative bleu) ───────────────────────────────────────
  secondary: {
    container: { backgroundColor: LUNA_COLORS.primary, borderWidth: 0, ...shadows.button },
    text: { color: LUNA_COLORS.textInverse },
    loaderColor: LUNA_COLORS.textInverse,
  },
  // ── Bordé (transparent + bordure 1.5px) ─────────────────────────────────
  bordered: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: LUNA_COLORS.secondary },
    text: { color: LUNA_COLORS.secondary },
    loaderColor: LUNA_COLORS.secondary,
  },
  // ── Léger (fond semi-transparent bleu) ────────────────────────────────
  light: {
    container: { backgroundColor: `${LUNA_COLORS.secondary}18`, borderWidth: 0 }, // ✨ Subtle tint
    text: { color: LUNA_COLORS.secondary },
    loaderColor: LUNA_COLORS.secondary,
  },
  // ── Ghost (texte seul, pas de fond) ──────────────────────────────────
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 0 },
    text: { color: LUNA_COLORS.secondary },
    loaderColor: LUNA_COLORS.secondary,
  },
  // ── Danger (rouge #dc2626 avec ombre colorée) ─────────────────────────
  danger: {
    container: { backgroundColor: LUNA_COLORS.danger, borderWidth: 0, ...shadows.button },
    text: { color: LUNA_COLORS.textInverse },
    loaderColor: LUNA_COLORS.textInverse,
  },
};

// ✨ Tailles HeroUI
const sizeConfig: Record<ButtonSize, { height: number; px: number; fs: number; loaderSize: number }> = {
  sm: { height: 36, px: spacing.lg, fs: fontSize.sm, loaderSize: 14 },
  md: { height: 48, px: spacing.xl, fs: fontSize.base, loaderSize: 16 }, // ✨ HeroUI 48px
  lg: { height: 56, px: spacing.xxl, fs: fontSize.lg, loaderSize: 18 }, // ✨ HeroUI 56px
};

export const Button = React.memo(function Button({
  title,
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  onPress,
  ...rest
}: ButtonProps): React.JSX.Element {
  const vStyle = variantConfig[variant];
  const sConf = sizeConfig[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75} // ✨ HeroUI activeOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          borderRadius: borderRadius.full, // ✨ Coins full
          height: sConf.height,
          paddingHorizontal: sConf.px,
          opacity: isDisabled ? 0.45 : 1,
        },
        vStyle.container,
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.loaderColor} size={sConf.loaderSize} />
      ) : (
        <Text
          style={{
            textAlign: 'center',
            includeFontPadding: false,
            fontSize: sConf.fs,
            fontWeight: fontWeight.bold,
            ...vStyle.text,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

export default Button;
