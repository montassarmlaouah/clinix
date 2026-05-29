import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';
import { LUNA_COLORS } from '@/src/theme/colors';

export default function SuperAdminLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
      <Tabs
        screenOptions={{
          ...screenOptions,
          tabBarActiveTintColor: LUNA_COLORS.primary,
          headerShown: false,
        }}
      >
        {/* ── 5 onglets visibles ── */}
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: createTabBarIcon('dashboard') }} />
        <Tabs.Screen name="organisations" options={{ title: 'Cliniques', tabBarIcon: createTabBarIcon('home') }} />
        <Tabs.Screen name="medecins-admin" options={{ title: 'Utilisateurs', tabBarIcon: createTabBarIcon('users') }} />
        <Tabs.Screen name="abonnements" options={{ title: 'Abonnements', tabBarIcon: createTabBarIcon('fileText') }} />
        <Tabs.Screen name="stripe-config" options={{ title: 'Config', tabBarIcon: createTabBarIcon('clipboard') }} />

        {/* ── Écrans cachés ── */}
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}
