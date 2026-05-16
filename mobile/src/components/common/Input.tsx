import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?:           string;
  value:            string;
  onChangeText:     (text: string) => void;
  error?:           string;
  secureTextEntry?: boolean;
  keyboardType?:    KeyboardTypeOptions;
  leftIcon?:        React.ReactNode;
  rightIcon?:       React.ReactNode;
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function Input({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  leftIcon,
  rightIcon,
  placeholder,
  ...rest
}: InputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? LUNA_COLORS.error
    : isFocused
    ? LUNA_COLORS.secondary
    : LUNA_COLORS.borderDark;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.focused,
          !!error && styles.errorBorder,
        ]}
      >
        {leftIcon ? (
          <View style={styles.iconLeft}>{leftIcon}</View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          placeholder={placeholder}
          placeholderTextColor={LUNA_COLORS.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            !!leftIcon  && styles.inputWithLeft,
            !!rightIcon && styles.inputWithRight,
          ]}
          {...rest}
        />

        {rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.medium,
    color:        LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: LUNA_COLORS.surface,
    borderWidth:     1.5,
    borderRadius:    borderRadius.md,
    minHeight:       48,
  },
  focused: {
    borderColor: LUNA_COLORS.secondary,
  },
  errorBorder: {
    borderColor: LUNA_COLORS.error,
  },
  input: {
    flex:             1,
    paddingVertical:  spacing.md,
    paddingHorizontal:spacing.lg,
    fontSize:         fontSize.base,
    color:            LUNA_COLORS.textPrimary,
    includeFontPadding: false,
  },
  inputWithLeft: {
    paddingLeft: spacing.xs,
  },
  inputWithRight: {
    paddingRight: spacing.xs,
  },
  iconLeft: {
    paddingLeft:  spacing.lg,
    alignItems:   'center',
    justifyContent: 'center',
  },
  iconRight: {
    paddingRight: spacing.lg,
    alignItems:   'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize:   fontSize.xs,
    color:      LUNA_COLORS.error,
    marginTop:  spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input;
