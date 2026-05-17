import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas alignée header.html : Dashboard · Équipements (Pannes via menu latéral) */
export default function TechnicienLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: createTabBarIcon('speedometer-outline'),
        }}
      />
      <Tabs.Screen
        name="equipements"
        options={{
          title: 'Équipements',
          tabBarIcon: createTabBarIcon('construct-outline'),
        }}
      />
      <Tabs.Screen name="pannes" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="chambres" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}
