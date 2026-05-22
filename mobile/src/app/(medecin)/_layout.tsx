import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { createTabBarIcon, RoleTabsShell } from '@/src/components/common';
import { hiddenTabScreenOptions, useLunaTabBarOptions } from '@/src/theme/tabBar';

interface Contact {
  id: number;
  unreadCount?: number;
}

/** Barre du bas : 3 icônes — Accueil · Patients · Messages */
export default function MedecinLayout(): React.JSX.Element {
  const userId = useAuthStore((s) => s.userId);
  const [unread, setUnread] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenOptions = useLunaTabBarOptions();

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    async function fetchUnread() {
      try {
        const contacts = await apiGet<Contact[]>(MESSAGES.CONTACTS(userId!));
        if (!mounted) return;
        setUnread(contacts.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0));
      } catch {
        /* ignore */
      }
    }

    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30_000);
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);

  return (
    <RoleTabsShell>
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
        name="messagerie"
        options={{
          title: 'Messages',
          tabBarIcon: createTabBarIcon('chatbubbles-outline', { badge: unread }),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: createTabBarIcon('menu-outline'),
        }}
      />
      {/* ── Écrans cachés : dossiers spécifiques ── */}
      <Tabs.Screen name="operations"                          options={hiddenTabScreenOptions} />
      <Tabs.Screen name="profil"                              options={hiddenTabScreenOptions} />
      <Tabs.Screen name="examens"                             options={hiddenTabScreenOptions} />
      <Tabs.Screen name="conges"                              options={hiddenTabScreenOptions} />
      <Tabs.Screen name="rendez-vous"                         options={hiddenTabScreenOptions} />
      <Tabs.Screen name="demandes-medicament"                 options={hiddenTabScreenOptions} />
      <Tabs.Screen name="demandes-operation"                  options={hiddenTabScreenOptions} />
      <Tabs.Screen name="alertes"                             options={hiddenTabScreenOptions} />
      <Tabs.Screen name="hospitalisations"                    options={hiddenTabScreenOptions} />
      <Tabs.Screen name="ordonnances"                         options={hiddenTabScreenOptions} />
      <Tabs.Screen name="taches-soins"                        options={hiddenTabScreenOptions} />
      <Tabs.Screen name="notes"                               options={hiddenTabScreenOptions} />
      <Tabs.Screen name="planning"                            options={hiddenTabScreenOptions} />
      <Tabs.Screen name="scanner"                             options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement"                          options={hiddenTabScreenOptions} />
      <Tabs.Screen name="abonnement-paiement"                 options={hiddenTabScreenOptions} />
      <Tabs.Screen name="tarifs"                              options={hiddenTabScreenOptions} />
      <Tabs.Screen name="change-organisation"                 options={hiddenTabScreenOptions} />
      <Tabs.Screen name="notifications"                       options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]"                       options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/consultation"          options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/ordonnance"            options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/examens"               options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/constantes"            options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/observations"          options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/hospitalisations"      options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/diagnostics"           options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/dossier"               options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/prescriptions"         options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/rapport/[rapportId]"   options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/sortie"                options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/[id]/transfert"             options={hiddenTabScreenOptions} />
      <Tabs.Screen name="operations/[id]"                     options={hiddenTabScreenOptions} />
      <Tabs.Screen name="operations/[id]/plan"                options={hiddenTabScreenOptions} />
      <Tabs.Screen name="operations/[id]/compte-rendu"        options={hiddenTabScreenOptions} />
      <Tabs.Screen name="messagerie/[contactId]"              options={hiddenTabScreenOptions} />
      <Tabs.Screen name="transferts/creer"                    options={hiddenTabScreenOptions} />
      <Tabs.Screen name="patients/nouveau"                    options={hiddenTabScreenOptions} />
      <Tabs.Screen name="operations/nouveau"                  options={hiddenTabScreenOptions} />
      <Tabs.Screen name="medicament-nouveau"                  options={hiddenTabScreenOptions} />
      {/* ── Routeur dynamique (doit être déclaré en dernier) ── */}
      <Tabs.Screen name="[screen]"                            options={hiddenTabScreenOptions} />
    </Tabs>
    </RoleTabsShell>
  );
}
