import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { LUNA_COLORS } from '@/src/theme/colors';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
}

/**
 * ✨ Loading Spinner - Spinner animé moderne (HeroUI style)
 */
export const LoadingSpinner = React.memo(function LoadingSpinner({
  size = 'md',
  color = LUNA_COLORS.secondary,
  style,
}: LoadingSpinnerProps): React.JSX.Element {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 56,
  };

  const borderWidthMap = {
    sm: 2,
    md: 3,
    lg: 4,
  };

  const dimension = sizeMap[size];
  const borderWidth = borderWidthMap[size];

  return (
    <Animated.View
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderWidth,
          borderColor: `${color}40`,
          borderTopColor: color,
          borderRightColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

/**
 * ✨ Loading Overlay - Écran complet de loading
 */
export const LoadingOverlayComponent = React.memo(function LoadingOverlay({
  message = 'Chargement...',
}: {
  message?: string;
}): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LUNA_COLORS.background,
      }}
    >
      <LoadingSpinner size="lg" />
    </View>
  );
});

/**
 * ✨ Pulse Loader - Animation pulse (ex: refresh)
 */
export const PulseLoader = React.memo(function PulseLoader({
  size = 'md',
  color = LUNA_COLORS.secondary,
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}): React.JSX.Element {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.8, 1], [0.3, 1], Extrapolate.CLAMP),
  }));

  const sizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  const dimension = sizeMap[size];

  return (
    <Animated.View
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
});
