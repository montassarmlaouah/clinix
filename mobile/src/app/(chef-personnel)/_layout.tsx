import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Accueil · Planning · Présences */
export default function ChefPersonnelLayout(): React.JSX.Element {
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
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: createTabBarIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="presences"
        options={{
          title: 'Présences',
          tabBarIcon: createTabBarIcon('time-outline'),
        }}
      />
      <Tabs.Screen name="conges" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="conges-medecin" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
    </Tabs>
  );
}
