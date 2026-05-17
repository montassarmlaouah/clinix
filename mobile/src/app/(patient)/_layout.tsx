import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Dossier · Ordonnances · RDV */
export default function PatientLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
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
      <Tabs.Screen name="resultats" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="teleconsultation" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}
