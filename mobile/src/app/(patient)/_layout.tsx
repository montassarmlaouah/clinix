import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Dossier · Ordonnances · RDV */
export default function PatientLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dossier"
        options={{
          title: 'Dossier',
          tabBarIcon: createTabBarIcon('folder-open-outline'),
        }}
      />
      <Tabs.Screen
        name="ordonnances"
        options={{
          title: 'Ordonnances',
          tabBarIcon: createTabBarIcon('document-text-outline'),
        }}
      />
      <Tabs.Screen
        name="rendez-vous"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: createTabBarIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen name="resultats" options={{ href: null }} />
      <Tabs.Screen name="teleconsultation" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
    </Tabs>
  );
}
