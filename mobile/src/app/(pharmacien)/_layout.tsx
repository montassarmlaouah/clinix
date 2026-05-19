import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icÃ´nes â€” Accueil Â· Stock Â· Demandes */
export default function PharmacienLayout(): React.JSX.Element {
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
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: createTabBarIcon('medkit-outline'),
        }}
      />
      <Tabs.Screen
        name="demandes"
        options={{
          title: 'Demandes',
          tabBarIcon: createTabBarIcon('clipboard-outline'),
        }}
      />
      <Tabs.Screen name="alertes" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="pharmacie" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />      <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}

