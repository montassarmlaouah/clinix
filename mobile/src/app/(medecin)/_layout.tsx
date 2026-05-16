import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { apiGet } from '@/src/api/client';
import { MESSAGES } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { createTabBarIcon } from '@/src/components/common';
import { useLunaTabBarOptions } from '@/src/theme/tabBar';

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
      <Tabs.Screen name="planning" options={{ href: null }} />
      <Tabs.Screen name="operations" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="statistiques" options={{ href: null }} />
      <Tabs.Screen name="taches-soins" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="ordonnances" options={{ href: null }} />
      <Tabs.Screen name="demandes-medicament" options={{ href: null }} />
      <Tabs.Screen name="demandes-operation" options={{ href: null }} />
      <Tabs.Screen name="hospitalisations" options={{ href: null }} />
      <Tabs.Screen name="change-organisation" options={{ href: null }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="abonnement" options={{ href: null }} />
      <Tabs.Screen name="alertes" options={{ href: null }} />
      <Tabs.Screen name="conges" options={{ href: null }} />
      <Tabs.Screen name="rendez-vous" options={{ href: null }} />
      <Tabs.Screen name="examens" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/consultation" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/ordonnance" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/examens" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/constantes" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/observations" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/hospitalisations" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/diagnostics" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/dossier" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/prescriptions" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/rapport/[rapportId]" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/sortie" options={{ href: null }} />
      <Tabs.Screen name="patients/[id]/transfert" options={{ href: null }} />
      <Tabs.Screen name="operations/[id]" options={{ href: null }} />
      <Tabs.Screen name="operations/[id]/plan" options={{ href: null }} />
      <Tabs.Screen name="operations/[id]/compte-rendu" options={{ href: null }} />
      <Tabs.Screen name="messagerie/[contactId]" options={{ href: null }} />
      <Tabs.Screen name="transferts/creer" options={{ href: null }} />
      <Tabs.Screen name="patients/nouveau" options={{ href: null }} />
      <Tabs.Screen name="operations/nouveau" options={{ href: null }} />
    </Tabs>
  );
}
