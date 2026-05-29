import React, { useState } from 'react';
import { Text, TextInput, type TextInputProps, View, type TextStyle, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.memo(function Input({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  leftIcon,
  rightIcon,
  placeholder,
  ...rest
}: InputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  // ✨ Bordure HeroUI : error > focused > default
  const borderColor = error
    ? LUNA_COLORS.danger
    : isFocused
      ? LUNA_COLORS.secondary
      : LUNA_COLORS.borderInput;

  const wrapperStyle: ViewStyle = { marginBottom: spacing.md };

  // ✨ Label flottant HeroUI : fontSize 12, semibold, gris-bleu
  const labelStyle: TextStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  };

  // ✨ Container input HeroUI : hauteur 52px, coins 12px, bordure 1.5px
  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.inputBg, // ✨ #f4f9fd
    borderWidth: 1.5,
    borderColor,
    borderRadius: borderRadius.md, // ✨ 12px
    minHeight: 52, // ✨ HeroUI 52px
    ...(isFocused && !error
      ? {
          borderWidth: 2,
          borderColor: LUNA_COLORS.secondary,
          // ✨ Focus glow HeroUI (léger shadow blur bleu)
          shadowColor: LUNA_COLORS.secondary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 2,
        }
      : {}),
    ...(error
      ? {
          borderWidth: 2,
          borderColor: LUNA_COLORS.danger,
          shadowColor: LUNA_COLORS.danger,
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {}),
  };

  const inputStyle: TextStyle = {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: leftIcon ? spacing.xs : spacing.lg,
    paddingRight: rightIcon ? spacing.xs : spacing.lg,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    includeFontPadding: false,
    fontWeight: fontWeight.regular,
  };

  const iconStyle: ViewStyle = {
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    color: LUNA_COLORS.textSecondary, // ✨ Icône grise secondaire
  };

  const errorTextStyle: TextStyle = {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    fontWeight: fontWeight.medium,
  };

  return (
    <View style={wrapperStyle}>
      {/* ✨ Label flottant uppercase */}
      {label ? <Text style={labelStyle}>{label}</Text> : null}

      {/* ✨ Input container avec icons */}
      <View style={inputContainerStyle}>
        {leftIcon ? <View style={iconStyle}>{leftIcon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType="default"
          placeholder={placeholder}
          placeholderTextColor={LUNA_COLORS.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyle}
          {...rest}
        />

        {rightIcon ? <View style={iconStyle}>{rightIcon}</View> : null}
      </View>

      {/* ✨ Message d'erreur */}
      {error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </View>
  );
});
