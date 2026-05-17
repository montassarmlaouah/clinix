import React from 'react';

import { usePageHeader } from '@/src/hooks/usePageHeader';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';

export interface LunaAccessHeaderProps {
  /** Titre de la page (ex. « Chambres ») */
  pageTitle?: string;
  pageSubtitle?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
  showProfil?: boolean;
  right?: React.ReactNode;
}

/** Définit l’en-tête global (barre teal menu · logo · notif · profil). */
export function LunaAccessHeader({
  pageTitle,
  pageSubtitle,
  showMenu = true,
  showNotifications = true,
  showProfil = true,
  right,
}: LunaAccessHeaderProps): React.JSX.Element | null {
  const layoutHeaderEnabled = usePageHeaderStore((s) => s.layoutHeaderEnabled);

  usePageHeader({
    title: pageTitle ?? 'Accueil',
    subtitle: pageSubtitle,
    showMenu,
    showNotifications,
    showProfil,
    right,
  });

  return layoutHeaderEnabled ? null : <></>;
}
