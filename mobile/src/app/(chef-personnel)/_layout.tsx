import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icÃ´nes â€” Accueil Â· Planning Â· PrÃ©sences */
export default function ChefPersonnelLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
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
          title: 'PrÃ©sences',
          tabBarIcon: createTabBarIcon('time-outline'),
        }}
      />
      <Tabs.Screen name="conges" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="conges-medecin" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />      <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}

