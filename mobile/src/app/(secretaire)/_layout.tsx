import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas alignée header.html : Dashboard · Agenda · Facturation · Profil */
export default function SecretaireLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: createTabBarIcon('speedometer-outline'),
        }}
      />
      <Tabs.Screen
        name="rendez-vous"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: createTabBarIcon('calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="abonnement"
        options={{
          title: 'Facturation',
          tabBarIcon: createTabBarIcon('receipt-outline'),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: createTabBarIcon('person-circle-outline'),
        }}
      />
      <Tabs.Screen name="patients" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="transferts" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
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
      <Tabs.Screen name="tarifs" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement-paiement" options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}
