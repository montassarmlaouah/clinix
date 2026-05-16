import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Accueil · Agenda · Patients */
export default function SecretaireLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: createTabBarIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="rendez-vous"
        options={{
          title: 'Agenda',
          tabBarIcon: createTabBarIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: createTabBarIcon('people-outline'),
        }}
      />
      <Tabs.Screen name="transferts" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="admissions" options={{ href: null }} />
      <Tabs.Screen name="admissions/creer" options={{ href: null }} />
      <Tabs.Screen name="patients/nouveau" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/dossier" options={{ href: null }} />
      <Tabs.Screen name="rendez-vous/nouveau" options={{ href: null }} />
      <Tabs.Screen name="rendez-vous/[id]" options={{ href: null }} />
      <Tabs.Screen name="transferts/[id]" options={{ href: null }} />
      <Tabs.Screen name="chambres" options={{ href: null }} />
      <Tabs.Screen name="conges-medecin" options={{ href: null }} />
      <Tabs.Screen name="demandes-operation" options={{ href: null }} />
      <Tabs.Screen name="demandes-medicament" options={{ href: null }} />
      <Tabs.Screen name="abonnement" options={{ href: null }} />
      <Tabs.Screen name="tarifs" options={{ href: null }} />
      <Tabs.Screen name="abonnement-paiement" options={{ href: null }} />
    </Tabs>
  );
}
