import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, TextInputProps, Platform } from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';

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
  }, [isFocused, value]);

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
      : LUNA_COLORS.borderDark;

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { borderColor }]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.label, labelStyle]}>
            {label}
          </Animated.Text>
          <TextInput
            style={[styles.input, icon ? { paddingLeft: 8 } : { paddingLeft: 16 }]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={value}
            placeholder={isFocused ? '' : ' '} // keeps label animated nicely
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
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: LUNA_COLORS.textPrimary,
    paddingTop: 16, // to push text below floating label
    paddingRight: 16,
  },
  iconContainer: {
    paddingLeft: 16,
    justifyContent: 'center',
  },
  suffixContainer: {
    paddingRight: 16,
    justifyContent: 'center',
  },
  suffix: {
    fontSize: 16,
    color: LUNA_COLORS.textSecondary,
  },
  errorText: {
    color: LUNA_COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});