import { Stack } from 'expo-router';

import { LUNA_COLORS } from '@/src/theme/colors';

export default function RdvStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:  false,
        contentStyle: { backgroundColor: LUNA_COLORS.background },
        animation:    'slide_from_right',
      }}
    />
  );
}
