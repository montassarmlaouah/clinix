import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';

export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  count?: number;
  spacing?: number;
}

/**
 * ✨ Skeleton Loader - Placeholder animé pour loadings
 * Utilise React Native Reanimated pour animations fluides
 */
export const SkeletonLoader = React.memo(function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius: br = 8,
  style,
  count = 1,
  spacing: gap = 12,
}: SkeletonLoaderProps): React.JSX.Element {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width,
              height,
              borderRadius: br,
              backgroundColor: LUNA_COLORS.surfaceLight,
              marginBottom: i < count - 1 ? gap : 0,
            },
            animatedStyle,
            style,
          ]}
        />
      ))}
    </View>
  );
});

/**
 * ✨ Skeleton Card - Placeholder pour cartes (ligne complète)
 */
export const SkeletonCard = React.memo(function SkeletonCard(): React.JSX.Element {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          borderRadius: borderRadius.lg,
          backgroundColor: LUNA_COLORS.surface,
          borderWidth: 1,
          borderColor: LUNA_COLORS.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        animatedStyle,
      ]}
    >
      {/* Header line */}
      <View
        style={{
          height: 16,
          borderRadius: borderRadius.sm,
          backgroundColor: LUNA_COLORS.surfaceLight,
          marginBottom: spacing.md,
          width: '60%',
        }}
      />
      {/* Content lines */}
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            height: 12,
            borderRadius: borderRadius.xs,
            backgroundColor: LUNA_COLORS.surfaceLight,
            width: '100%',
          }}
        />
        <View
          style={{
            height: 12,
            borderRadius: borderRadius.xs,
            backgroundColor: LUNA_COLORS.surfaceLight,
            width: '85%',
          }}
        />
        <View
          style={{
            height: 12,
            borderRadius: borderRadius.xs,
            backgroundColor: LUNA_COLORS.surfaceLight,
            width: '70%',
          }}
        />
      </View>
    </Animated.View>
  );
});

/**
 * ✨ Skeleton List - Multiple cartes pour listes
 */
export const SkeletonList = React.memo(function SkeletonList({
  count = 3,
}: {
  count?: number;
}): React.JSX.Element {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
});
