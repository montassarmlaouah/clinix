import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LoadingOverlayProps {
  /** Si false, le composant ne s'affiche pas. Par défaut: true */
  visible?: boolean;
  /** Couleur de l'indicateur. Par défaut: secondary */
  color?: string;
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function LoadingOverlay({
  visible = true,
  color   = LUNA_COLORS.secondary,
}: LoadingOverlayProps): React.JSX.Element | null {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, { pointerEvents: 'box-only' }]}>
      <ActivityIndicator color={color} size="large" />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LUNA_COLORS.overlay, // ✨ overlay HeroUI
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          999,
  },
});

export default LoadingOverlay;
