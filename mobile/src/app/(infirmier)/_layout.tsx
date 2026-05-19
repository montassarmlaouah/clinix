import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

/**
 * Layout infirmier — 4 onglets visibles uniquement :
 *   Accueil · Patients · Soins · Menu
 *
 * Toutes les autres pages sont accessibles via le Menu
 * (alertes, planning, présences, signalements, congés, etc.)
 */
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
        // ── CORRECTION : cohérent avec soins.tsx qui filtre les deux statuts
        setPendingTasks(
          admins.filter(
            (a) => a.statut !== 'ADMINISTRE' && a.statut !== 'FAIT',
          ).length,
        );
      } catch {
        /* ignore — badge reste à la valeur précédente */
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
    <RoleTabsShell>
      <Tabs screenOptions={screenOptions}>

        {/* ── 4 onglets visibles ───────────────────────────────────────── */}

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

        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: createTabBarIcon('menu-outline'),
          }}
        />

        {/* ── Pages cachées — accessibles via navigation programmatique ── */}

        {/* Profil & Paramètres */}
        <Tabs.Screen name="profil"      options={hiddenTabScreenOptions} />

        {/* Activités */}
        <Tabs.Screen name="planning"    options={hiddenTabScreenOptions} />
        <Tabs.Screen name="presences"   options={hiddenTabScreenOptions} />
        <Tabs.Screen name="visites-jour" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="congie"      options={hiddenTabScreenOptions} />

        {/* Alertes & Signalements */}
        <Tabs.Screen name="alertes"     options={hiddenTabScreenOptions} />
        <Tabs.Screen name="signalements" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="signalement/creer"  options={hiddenTabScreenOptions} />
        <Tabs.Screen name="signalement/nouveau" options={hiddenTabScreenOptions} />

        {/* Patients — sous-pages */}
        <Tabs.Screen name="patients/[id]"                        options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]/administrations"        options={hiddenTabScreenOptions} />
        <Tabs.Screen name="patients/[id]/constantes"             options={hiddenTabScreenOptions} />

        {/* Hospitalisation & Demandes */}
        <Tabs.Screen name="hospitalisations"     options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-medicament"  options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-operation"   options={hiddenTabScreenOptions} />
        <Tabs.Screen name="demandes-operation/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="taches-soins"         options={hiddenTabScreenOptions} />
        <Tabs.Screen name="surveillance-soins"   options={hiddenTabScreenOptions} />
        <Tabs.Screen name="rendez-vous"          options={hiddenTabScreenOptions} />
        <Tabs.Screen name="chambres"             options={hiddenTabScreenOptions} />
        <Tabs.Screen name="chambres/[id]"        options={hiddenTabScreenOptions} />
        <Tabs.Screen name="statistiques"         options={hiddenTabScreenOptions} />

        {/* Outils spéciaux */}
        <Tabs.Screen name="scanner"      options={hiddenTabScreenOptions} />
        <Tabs.Screen name="bracelet"     options={hiddenTabScreenOptions} />
        <Tabs.Screen name="check-list"   options={hiddenTabScreenOptions} />
        <Tabs.Screen name="sspi"         options={hiddenTabScreenOptions} />
        <Tabs.Screen name="transmissions" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="notifications" options={hiddenTabScreenOptions} />

        {/* ── SUPPRIMÉ de la tab bar ───────────────────────────────────── */}
        {/* statistiques.tsx → KPIs fusionnés dans index.tsx (dashboard)   */}

      </Tabs>
    </RoleTabsShell>
  );
}