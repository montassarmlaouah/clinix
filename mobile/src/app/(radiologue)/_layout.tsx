import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { IMAGERIES } from '@/src/api/endpoints';
import { createTabBarIcon } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/** Barre du bas : 3 icônes — Accueil · File · Examens */
export default function RadiologueLayout(): React.JSX.Element {
  const [pendingCount, setPendingCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenOptions = useLunaTabBarOptions();

  useEffect(() => {
    let mounted = true;

    async function fetchBadges() {
      try {
        const att = await apiGet<unknown[]>(IMAGERIES.EN_ATTENTE).catch(() => []);
        if (!mounted) return;
        setPendingCount(att.length);
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
  }, []);

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
        name="demandes"
        options={{
          title: 'File',
          tabBarIcon: createTabBarIcon('time-outline', { badge: pendingCount }),
        }}
      />
      <Tabs.Screen
        name="rapports"
        options={{
          title: 'Examens',
          tabBarIcon: createTabBarIcon('document-text-outline'),
        }}
      />
      <Tabs.Screen name="messagerie" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="agenda" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="examen" options={hiddenTabScreenOptions} />
      <Tabs.Screen name="rapport" options={hiddenTabScreenOptions} />
    </Tabs>
  );
}
