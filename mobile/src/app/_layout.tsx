import { useRouter, useSegments, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { RoleDrawer } from '@/src/components/common';
import { rolesMatch } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';
import { subscriptionEvents } from '@/src/api/subscriptionEvents';

// ── Rôles requis par groupe de routes ─────────────────────────────────────────
const REQUIRED_ROLE: Record<string, string> = {
  '(secretaire)':     'ROLE_SECRETAIRE',
  '(infirmier)':      'ROLE_INFIRMIER',
  '(medecin)':        'ROLE_MEDECIN',
  '(radiologue)':     'ROLE_RADIOLOGUE',
  '(admin)':          'ROLE_ADMIN_CLINIQUE',
  '(superadmin)':     'ROLE_SUPER_ADMIN',
  '(patient)':        'ROLE_PATIENT',
  '(pharmacien)':     'ROLE_PHARMACIEN',
  '(chef-personnel)': 'ROLE_CHEF_PERSONNEL',
  '(technicien)':     'ROLE_TECHNICIEN_MAINTENANCE',
};

// Groupes / segments accessibles sans authentification
const PUBLIC_SEGMENTS = new Set(['', 'index', 'splash', 'onboarding', 'welcome', '(auth)']);

// ── Composant racine ──────────────────────────────────────────────────────────
export default function RootLayout() {
  const segments     = useSegments();
  const router       = useRouter();
  const didRedirect  = useRef(false);

  // ── Lire tout l'état auth en UNE SEULE FOIS pour éviter les re-renders
  //    partiels quand setAuth() met à jour plusieurs champs (BUG 2)
  const { userId, role, estCabinet, isRehydrated } = useAuthStore();

  // ── Gérer les erreurs 402 abonnement expiré ───────────────────────────────
  useEffect(() => {
    const unsub = subscriptionEvents.subscribe(() => {
      Alert.alert(
        'Abonnement expiré',
        'Votre abonnement est expiré ou inactif. Veuillez renouveler votre abonnement pour continuer.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Attendre que Zustand ait restauré le state persisté
    if (!isRehydrated) return;

    // Éviter les redirections multiples consécutives
    if (didRedirect.current) return;

    const firstSegment = segments[0] as string | undefined ?? '';

    // Segments publics → aucune vérification
    if (PUBLIC_SEGMENTS.has(firstSegment)) return;

    // Non authentifié → login
    if (userId == null) {
      didRedirect.current = true;
      router.replace('/(auth)/login');
      return;
    }

    // Vérification du rôle pour le groupe courant
    const requiredRole = REQUIRED_ROLE[firstSegment];
    if (requiredRole && !rolesMatch(role, requiredRole)) {
      didRedirect.current = true;
      router.replace('/(auth)/login');
      return;
    }
  }, [segments, userId, role, estCabinet, isRehydrated, router]);

  // Reset le flag quand on revient sur un segment public OU quand l'utilisateur change
  useEffect(() => {
    const firstSegment = segments[0] as string | undefined ?? '';
    if (PUBLIC_SEGMENTS.has(firstSegment)) {
      didRedirect.current = false;
    }
  }, [segments]);

  // Reset le flag quand le userId change (reconnexion avec un autre rôle)
  useEffect(() => {
    didRedirect.current = false;
  }, [userId, role]);

  const firstSegment = segments[0] as string | undefined ?? '';
  const showDrawer = Boolean(userId) && !PUBLIC_SEGMENTS.has(firstSegment);

  return (
    <>
      <StatusBar style="light" />
      {showDrawer ? <RoleDrawer /> : null}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(superadmin)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(medecin)" />
        <Stack.Screen name="(secretaire)" />
        <Stack.Screen name="(infirmier)" />
        <Stack.Screen name="(radiologue)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(pharmacien)" />
        <Stack.Screen name="(chef-personnel)" />
        <Stack.Screen name="(technicien)" />
        <Stack.Screen name="notifications" />
      </Stack>
    </>
  );
}
