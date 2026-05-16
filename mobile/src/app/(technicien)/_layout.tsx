import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Accueil · Équipements · Pannes */
export default function TechnicienLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: createTabBarIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="equipements"
        options={{
          title: 'Équipements',
          tabBarIcon: createTabBarIcon('construct-outline'),
        }}
      />
      <Tabs.Screen
        name="pannes"
        options={{
          title: 'Pannes',
          tabBarIcon: createTabBarIcon('warning-outline'),
        }}
      />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="abonnement" options={{ href: null }} />
      <Tabs.Screen name="chambres" options={{ href: null }} />
    </Tabs>
  );
}
