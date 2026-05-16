import React from 'react';
import { Image, type ImageStyle, StyleSheet, View, type ViewStyle } from 'react-native';

import { CLINIX_LOGO } from '@/src/constants/branding';

export type ClinixLogoVariant = 'icon' | 'wordmark';

interface ClinixLogoProps {
  variant?: ClinixLogoVariant;
  /** Largeur cible */
  width?: number;
  height?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
}

export function ClinixLogo({
  variant = 'icon',
  width,
  height,
  style,
  containerStyle,
}: ClinixLogoProps): React.JSX.Element {
  const isWordmark = variant === 'wordmark';
  const w = width ?? (isWordmark ? 140 : 48);
  const h = height ?? (isWordmark ? 40 : 48);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Image
        source={CLINIX_LOGO}
        style={[styles.img, { width: w, height: h }, style]}
        resizeMode="contain"
        accessibilityLabel="CLINIX"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  img: {},
});
