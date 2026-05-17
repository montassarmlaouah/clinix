import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface PageHeaderState {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfil?: boolean;
  showBrand?: boolean;
  right?: ReactNode;
  /** Zone centrale (ex. filtre étage / service) */
  center?: ReactNode;
  onBack?: () => void;
  /** En-tête rendu par le layout parent (évite les doublons). */
  layoutHeaderEnabled: boolean;
}

interface PageHeaderStore extends PageHeaderState {
  setHeader: (patch: Partial<PageHeaderState>) => void;
  resetHeader: () => void;
  setLayoutHeaderEnabled: (enabled: boolean) => void;
}

const DEFAULT_HEADER: PageHeaderState = {
  title: 'Accueil',
  subtitle: undefined,
  showMenu: true,
  showBack: false,
  showNotifications: true,
  showProfil: true,
  showBrand: true,
  right: undefined,
  center: undefined,
  onBack: undefined,
  layoutHeaderEnabled: false,
};

export const usePageHeaderStore = create<PageHeaderStore>((set) => ({
  ...DEFAULT_HEADER,
  setHeader: (patch) => set((s) => ({ ...s, ...patch })),
  resetHeader: () => set({ ...DEFAULT_HEADER }),
  setLayoutHeaderEnabled: (enabled) => set({ layoutHeaderEnabled: enabled }),
}));
