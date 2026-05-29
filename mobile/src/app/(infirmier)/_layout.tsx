import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

function InfirmierLayoutComponent(): React.JSX.Element {
  const infirmierId = useAuthStore((s) => s.userId);
  const [pendingTasks, setPendingTasks] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ✨ Memoize screenOptions pour éviter recreations à chaque render
  const screenOptions = useMemo(() => useLunaTabBarOptions(), []);

  // ✨ useCallback pour stabiliser la fonction entre renders
  const fetchBadges = useCallback(async () => {
    if (!infirmierId) return;
    try {
      const admins = await apiGet<{ statut: string }[]>(
        ADMINISTRATIONS.BY_INFIRMIER(String(infirmierId)),
      );
      setPendingTasks(
        admins.filter(
          (a) => a.statut !== 'ADMINISTRE' && a.statut !== 'FAIT',
        ).length,
      );
    } catch {
      /* ignore */
    }
  }, [infirmierId]);

  // ✨ Optimisé: évite le "mounted" flag instable, nettoie l'intervalle correctement
  useEffect(() => {
    if (!infirmierId) return;

    // Appel initial
    fetchBadges();

    // Intervalle tous les 30s
    const interval = setInterval(fetchBadges, 30_000);

    // Nettoyage
    return () => {
      clearInterval(interval);
    };
  }, [infirmierId, fetchBadges]);

  return (
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions} initialRouteName="index">
        {/* ── 5 onglets visibles (Tab Bar) ─────────────────────────────────────── */}
        <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: createTabBarIcon('home') }} />
        <Tabs.Screen name="chambres" options={{ title: 'Chambres', tabBarIcon: createTabBarIcon('bed-outline') }} />
        <Tabs.Screen name="transmissions" options={{ title: 'Transmission', tabBarIcon: createTabBarIcon('clipboard') }} />
        <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: createTabBarIcon('calendar') }} />
        <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: createTabBarIcon('person') }} />

        {/* ── TOUS les autres écrans déclarés comme cachés ─────────────────────── */}
        <Tabs.Screen name="alertes" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="bracelet" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="check-list" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="congie" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-medicament" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-operation" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="hospitalisations" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="medicament-nouveau" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="menu" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="presences" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="rendez-vous" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="scanner" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="signalements" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="soins" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="sspi" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="statistiques" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="surveillance-soins" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="taches-soins" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="visites-jour" options={hiddenTabScreenOptions} />

        {/* Sous-dossiers */}
        <Tabs.Screen name="chambres/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-operation/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]/administrations" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]/constantes" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="signalement/creer" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="signalement/nouveau" options={hiddenTabScreenOptions} />
      </Tabs>
    </RoleTabsShell>
  );
}

// ✨ React.memo + export default pour éviter rerenders parents
export default React.memo(InfirmierLayoutComponent);
