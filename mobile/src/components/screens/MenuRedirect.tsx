import { Redirect } from 'expo-router';
import React from 'react';

import { normalizeRole, ROLE_ROUTES } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';

/** Ancien onglet Menu — redirige vers l'accueil du rôle */
export function MenuRedirect(): React.JSX.Element {
  const role = useAuthStore((s) => s.role);
  const norm = normalizeRole(role);
  const href =
    (norm && ROLE_ROUTES[norm]) ||
    (role && ROLE_ROUTES[role]) ||
    '/welcome';
  return <Redirect href={href as never} />;
}
