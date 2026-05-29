import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';

export interface LoadingOverlayProps {
  visible?: boolean;
  color?: string;
}

export const LoadingOverlay = React.memo(function LoadingOverlay({
  visible = true,
  color = LUNA_COLORS.secondary,
}: LoadingOverlayProps): React.JSX.Element | null {
  if (!visible) return null;

  return (
    <View
      style={{
        ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        backgroundColor: LUNA_COLORS.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
    >
      <ActivityIndicator color={color} size="large" />
    </View>
  );
});
