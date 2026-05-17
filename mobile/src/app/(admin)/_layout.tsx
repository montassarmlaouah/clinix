import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { ADMIN_TAB_SCREENS } from '@/src/constants/roleTabs';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : Dashboard · Services · Chambres · Équipements (icônes = accès rapide) */
export default function AdminLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
    <Tabs screenOptions={screenOptions} initialRouteName="dashboard">
      {ADMIN_TAB_SCREENS.map(({ name, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: name === 'dashboard' ? 'Dashboard' : name.charAt(0).toUpperCase() + name.slice(1),
            tabBarIcon: createTabBarIcon(icon),
          }}
        />
      ))}
      <Tabs.Screen name="patients" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="personnel" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="rendez-vous" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="pharmacie" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="tarifs" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement-paiement" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="demandes-operation" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="demandes-medicament" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="conges-medecin" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}
