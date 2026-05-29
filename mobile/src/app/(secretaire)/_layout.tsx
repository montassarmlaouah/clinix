import { Tabs } from 'expo-router';
import React from 'react';

import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

export default function SecretaireLayout(): React.JSX.Element {
  const screenOptions = useLunaTabBarOptions();

  return (
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions}>
        {/* ── 4 onglets visibles ── */}
        <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: createTabBarIcon('home') }} />
        <Tabs.Screen name="rendez-vous" options={{ title: 'Rendez-vous', tabBarIcon: createTabBarIcon('calendar') }} />
        <Tabs.Screen name="admissions" options={{ title: 'Admissions', tabBarIcon: createTabBarIcon('users') }} />
        <Tabs.Screen name="abonnement" options={{ title: 'Facturation', tabBarIcon: createTabBarIcon('fileText') }} />

        {/* ── Écrans cachés ── */}
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/nouveau" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]/dossier" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="rendez-vous/nouveau" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="rendez-vous/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="chambres" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-operation" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="conges-medecin" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-medicament" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="tarifs" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="abonnement-paiement" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="transferts" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="transferts/[id]" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}
