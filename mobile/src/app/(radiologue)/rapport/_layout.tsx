import { Stack } from 'expo-router';
import React from 'react';

export default function RapportLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation:   'slide_from_right',
      }}
    />
  );
}
