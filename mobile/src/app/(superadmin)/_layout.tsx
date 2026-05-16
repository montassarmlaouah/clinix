import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Dashboard · Cliniques · Abonnements */
export default function SuperAdminLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: createTabBarIcon('grid-outline'),
        }}
      />
      <Tabs.Screen
        name="organisations"
        options={{
          title: 'Cliniques',
          tabBarIcon: createTabBarIcon('business-outline'),
        }}
      />
      <Tabs.Screen
        name="abonnements"
        options={{
          title: 'Abonnements',
          tabBarIcon: createTabBarIcon('card-outline'),
        }}
      />
      <Tabs.Screen name="medecins-admin" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="stripe-config" options={{ href: null }} />
    </Tabs>
  );
}
