import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

export default function AdminLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions} initialRouteName="dashboard">
        {/* ── 5 onglets visibles ── */}
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: createTabBarIcon('dashboard') }} />
        <Tabs.Screen name="personnel" options={{ title: 'Personnel', tabBarIcon: createTabBarIcon('users') }} />
        <Tabs.Screen name="chambres" options={{ title: 'Clinique', tabBarIcon: createTabBarIcon('home') }} />
        <Tabs.Screen name="rendez-vous" options={{ title: 'Rapports', tabBarIcon: createTabBarIcon('clipboard') }} />
        <Tabs.Screen name="tarifs" options={{ title: 'Paramètres', tabBarIcon: createTabBarIcon('fileText') }} />

        {/* ── Écrans cachés ── */}
        <Tabs.Screen name="patients" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="pharmacie" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="abonnement-paiement" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="facturation-patient" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-operation" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-medicament" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="conges-medecin" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="services" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="equipements" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}
