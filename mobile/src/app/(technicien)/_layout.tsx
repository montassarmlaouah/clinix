import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas alignÃ©e header.html : Dashboard Â· Ã‰quipements (Pannes via menu latÃ©ral) */
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
          title: 'Ã‰quipements',
          tabBarIcon: createTabBarIcon('construct-outline'),
        }}
      />
      <Tabs.Screen name="pannes" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="chambres" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />      <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}

