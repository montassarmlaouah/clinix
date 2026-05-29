import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { IMAGERIES } from '@/src/api/endpoints';
import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

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
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions}>
        {/* ── 4 onglets visibles ── */}
        <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: createTabBarIcon('home') }} />
        <Tabs.Screen name="demandes" options={{ title: 'Examens', tabBarIcon: createTabBarIcon('reportMedical', { badge: pendingCount }) }} />
        <Tabs.Screen name="rapports" options={{ title: 'Résultats', tabBarIcon: createTabBarIcon('fileText') }} />
        <Tabs.Screen name="agenda" options={{ title: 'Planning', tabBarIcon: createTabBarIcon('calendar') }} />

        {/* ── Écrans cachés ── */}
        <Tabs.Screen name="messagerie" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profil" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="examen" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="rapport" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}
