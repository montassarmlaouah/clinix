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
        {/* 1. Dashboard */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Accueil',
            tabBarIcon: createTabBarIcon('grid-outline'),
          }}
        />
        {/* 2. Cliniques */}
        <Tabs.Screen
          name="organisations"
          options={{
            title: 'Cliniques',
            tabBarIcon: createTabBarIcon('business-outline'),
          }}
        />
        {/* 3. MÃ©decins (nouvel onglet) */}
        <Tabs.Screen
          name="medecins-admin"
          options={{
            title: 'MÃ©decins',
            tabBarIcon: createTabBarIcon('people-outline'),
          }}
        />
        {/* 4. Abonnements */}
        <Tabs.Screen
          name="abonnements"
          options={{
            title: 'Abonnements',
            tabBarIcon: createTabBarIcon('card-outline'),
          }}
        />
        {/* 5. Stripe Config (nouvel onglet) */}
        <Tabs.Screen
          name="stripe-config"
          options={{
            title: 'Stripe',
            tabBarIcon: createTabBarIcon('logo-stripe'),
          }}
        />
        {/* Ã‰crans cachÃ©s (menu, profil) */}
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />      <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}
