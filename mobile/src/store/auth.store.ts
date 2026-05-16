import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from './storage';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthData {
  token:       string | null;
  role:        string | null;
  userId:      string | number | null;
  cliniqueId:  string | number | null;
  cliniqueNom: string | null;
  nom:         string | null;
  prenom:      string | null;
  estCabinet:  boolean;
}

export interface AuthState extends AuthData {
  setAuth:      (payload: Partial<AuthData>) => void;
  clearAuth:    () => void;
  isRehydrated: boolean;
}

const initialState: AuthData = {
  token:       null,
  role:        null,
  userId:      null,
  cliniqueId:  null,
  cliniqueNom: null,
  nom:         null,
  prenom:      null,
  estCabinet:  false,
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      isRehydrated: false,

      setAuth: (payload: Partial<AuthData>) => {
        set((state) => ({ ...state, ...payload }));
      },

      clearAuth: () => {
        set({ ...initialState, isRehydrated: true });
      },
    }),
    {
      name:    'clinix-auth-v2',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        token:       state.token,
        role:        state.role,
        userId:      state.userId,
        cliniqueId:  state.cliniqueId,
        cliniqueNom: state.cliniqueNom,
        nom:         state.nom,
        prenom:      state.prenom,
        estCabinet:  state.estCabinet,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          useAuthStore.setState({ isRehydrated: true });
        } else {
          useAuthStore.setState({ isRehydrated: true });
        }
      },
    },
  ),
);

// ── Sélecteurs utilitaires ────────────────────────────────────────────────────
export const selectIsAuthenticated = (s: AuthState): boolean => !!s.token;
export const selectRole            = (s: AuthState): string | null => s.role;
export const selectCliniqueId      = (s: AuthState): string | number | null => s.cliniqueId;
