import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

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
      <Tabs.Screen name="transferts" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="admissions" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="admissions/creer" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/nouveau" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/dossier" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="rendez-vous/nouveau" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="rendez-vous/[id]" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="transferts/[id]" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="chambres" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="conges-medecin" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="demandes-operation" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="demandes-medicament" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="tarifs" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement-paiement" options={hiddenTabScreenOptions} />
    </Tabs>
  );
}
