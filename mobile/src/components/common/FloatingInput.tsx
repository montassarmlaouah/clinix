import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, TextInputProps } from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface FloatingInputProps extends TextInputProps {
  label: string;
  error?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  error,
  suffix,
  icon,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  const labelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12],
    }),
    color: error
      ? LUNA_COLORS.error
      : isFocused
        ? LUNA_COLORS.secondary
        : LUNA_COLORS.textSecondary,
  };

  const borderColor = error
    ? LUNA_COLORS.error
    : isFocused
      ? LUNA_COLORS.secondary
      : LUNA_COLORS.borderInput;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.focused,
          !!error && styles.errorBorder,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.label, labelStyle]}>
            {label}
          </Animated.Text>
          <TextInput
            style={[styles.input, icon ? { paddingLeft: spacing.sm } : { paddingLeft: spacing.lg }]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={value}
            placeholder={isFocused ? '' : ' '}
            placeholderTextColor="transparent"
            {...props}
          />
        </View>
        {suffix && (
          <View style={styles.suffixContainer}>
            <Text style={styles.suffix}>{suffix}</Text>
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    backgroundColor: LUNA_COLORS.inputBg, // ✨ fond inputBg HeroUI
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  focused: {
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
    shadowColor: '#2d9cdb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  errorBorder: {
    borderColor: LUNA_COLORS.error,
    borderWidth: 2,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 1,
    fontWeight: fontWeight.medium,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    paddingTop: 16,
    paddingRight: spacing.lg,
  },
  iconContainer: {
    paddingLeft: spacing.lg,
    justifyContent: 'center',
  },
  suffixContainer: {
    paddingRight: spacing.lg,
    justifyContent: 'center',
  },
  suffix: {
    fontSize: fontSize.base,
    color: LUNA_COLORS.textSecondary,
  },
  errorText: {
    color: LUNA_COLORS.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.lg,
  },
});
