import { Stack } from 'expo-router';
import React from 'react';

export default function AdmissionsLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: '#023859' },
        headerTintColor:  '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admissions' }} />
      <Stack.Screen name="creer" options={{ title: 'Nouvelle admission' }} />
    </Stack>
  );
}
