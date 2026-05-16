import { Stack } from 'expo-router';
import React from 'react';

import { LUNA_COLORS } from '@/src/theme/colors';

export default function ServicesLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: LUNA_COLORS.background },
      }}
    />
  );
}
