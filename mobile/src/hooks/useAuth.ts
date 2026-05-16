import { useRouter } from 'expo-router';

import { rolesMatch } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const { role, token, clearAuth } = useAuthStore();
  const router = useRouter();

  /** true si une session active est présente */
  const isLoggedIn: boolean = Boolean(token);

  /** Vérifie si l'utilisateur a exactement le rôle donné (ex: 'ROLE_MEDECIN') */
  function isRole(r: string): boolean {
    return rolesMatch(role, r);
  }

  /**
   * Déconnecte l'utilisateur :
   * 1. Purge le Zustand store (+ storage persisté via clearAuth)
   * 2. Redirige vers l'écran de connexion
   */
  async function logout(): Promise<void> {
    clearAuth();
    router.replace('/(auth)/login');
  }

  return { isLoggedIn, isRole, logout };
}
