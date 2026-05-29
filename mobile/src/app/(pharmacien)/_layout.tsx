import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

export default function PharmacienLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions}>
        {/* ── 4 onglets visibles ── */}
        <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: createTabBarIcon('home') }} />
        <Tabs.Screen name="demandes" options={{ title: 'Dispensations', tabBarIcon: createTabBarIcon('pill') }} />
        <Tabs.Screen name="stock" options={{ title: 'Stock', tabBarIcon: createTabBarIcon('package') }} />
        <Tabs.Screen name="pharmacie" options={{ title: 'Historique', tabBarIcon: createTabBarIcon('clipboard') }} />

        {/* ── Écrans cachés ── */}
        <Tabs.Screen name="alertes" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}
