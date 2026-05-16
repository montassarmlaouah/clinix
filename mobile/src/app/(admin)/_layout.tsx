import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Accueil · Patients · Personnel */
export default function AdminLayout(): React.JSX.Element {
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
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: createTabBarIcon('people-outline'),
        }}
      />
      <Tabs.Screen
        name="personnel"
        options={{
          title: 'Personnel',
          tabBarIcon: createTabBarIcon('person-outline'),
        }}
      />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="chambres" options={{ href: null }} />
      <Tabs.Screen name="equipements" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="abonnement" options={{ href: null }} />
      <Tabs.Screen name="rendez-vous" options={{ href: null }} />
      <Tabs.Screen name="pharmacie" options={{ href: null }} />
      <Tabs.Screen name="tarifs" options={{ href: null }} />
      <Tabs.Screen name="abonnement-paiement" options={{ href: null }} />
      <Tabs.Screen name="demandes-operation" options={{ href: null }} />
      <Tabs.Screen name="demandes-medicament" options={{ href: null }} />
      <Tabs.Screen name="conges-medecin" options={{ href: null }} />
    </Tabs>
  );
}
