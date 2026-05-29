import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

export default function PatientLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions}>
        {/* ── 4 onglets visibles ── */}
        <Tabs.Screen name="statistiques" options={{ title: 'Mon suivi', tabBarIcon: createTabBarIcon('dashboard') }} />
        <Tabs.Screen name="rendez-vous" options={{ title: 'Mes RDV', tabBarIcon: createTabBarIcon('calendar') }} />
        <Tabs.Screen name="dossier" options={{ title: 'Mon dossier', tabBarIcon: createTabBarIcon('fileText') }} />
        <Tabs.Screen name="ordonnances" options={{ title: 'Ordonnances', tabBarIcon: createTabBarIcon('pill') }} />

        {/* ── Écrans cachés ── */}
        <Tabs.Screen name="resultats" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="teleconsultation" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}
