import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';

interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

interface AuthGuardProps {
  requiredRole: string;
  children: React.ReactNode;
}

/** Normalise un rôle pour comparaison (ajoute ROLE_ si absent) */
function normalizeRole(r: string | null): string | null {
  if (!r) return null;
  return r.startsWith('ROLE_') ? r : `ROLE_${r}`;
}

export default function AuthGuard({ requiredRole, children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // ── Lire tout l'état auth en UNE SEULE FOIS pour éviter les re-renders
  //    partiels quand setAuth() met à jour plusieurs champs
  const { isRehydrated, token, role } = useAuthStore();

  useEffect(() => {
    if (!isRehydrated) return;

    function verify() {
      try {
        if (!token) {
          router.replace('/(auth)/login');
          return;
        }

        const decoded = jwtDecode<JwtPayload>(token);
        const now = Math.floor(Date.now() / 1000);

        if (decoded.exp && decoded.exp < now) {
          router.replace('/(auth)/login');
          return;
        }

        const jwtRole = normalizeRole(decoded.role ?? role);
        const reqRole = normalizeRole(requiredRole);
        if (jwtRole !== reqRole) {
          router.replace('/(auth)/login');
          return;
        }
      } catch {
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    }

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRehydrated, token, role, requiredRole]);

  if (!isRehydrated || checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LUNA_COLORS.background }}>
        <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
      </View>
    );
  }

  return <>{children}</>;
}
