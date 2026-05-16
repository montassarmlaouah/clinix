import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Accueil · Patients · Soins */
export default function InfirmierLayout(): React.JSX.Element {
  const infirmierId = useAuthStore((s) => s.userId);
  const [pendingTasks, setPendingTasks] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenOptions = useLunaTabBarOptions();

  useEffect(() => {
    if (!infirmierId) return;
    let mounted = true;

    async function fetchBadges() {
      try {
        const admins = await apiGet<{ statut: string }[]>(
          ADMINISTRATIONS.BY_INFIRMIER(String(infirmierId)),
        );
        if (!mounted) return;
        setPendingTasks(admins.filter((a) => a.statut !== 'FAIT').length);
      } catch {
        /* ignore */
      }
    }

    fetchBadges();
    intervalRef.current = setInterval(fetchBadges, 30_000);
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [infirmierId]);

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
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: createTabBarIcon('people-outline'),
        }}
      />
      <Tabs.Screen
        name="soins"
        options={{
          title: 'Soins',
          tabBarIcon: createTabBarIcon('medkit-outline', { badge: pendingTasks }),
        }}
      />
      <Tabs.Screen name="alertes" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="planning" options={{ href: null }} />
      <Tabs.Screen name="presences" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/administrations" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/constantes" options={{ href: null }} />
      <Tabs.Screen name="signalements" options={{ href: null }} />
      <Tabs.Screen name="signalement/creer" options={{ href: null }} />
      <Tabs.Screen name="signalement/nouveau" options={{ href: null }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="bracelet" options={{ href: null }} />
      <Tabs.Screen name="visites-jour" options={{ href: null }} />
      <Tabs.Screen name="hospitalisations" options={{ href: null }} />
      <Tabs.Screen name="congie" options={{ href: null }} />
      <Tabs.Screen name="check-list" options={{ href: null }} />
      <Tabs.Screen name="sspi" options={{ href: null }} />
      <Tabs.Screen name="transmissions" options={{ href: null }} />
      <Tabs.Screen name="demandes-operation" options={{ href: null }} />
      <Tabs.Screen name="demandes-medicament" options={{ href: null }} />
    </Tabs>
  );
}
