import React from 'react';

import { LunaHeroHeader } from '@/src/components/common/LunaHeroHeader';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Afficher le bouton retour (défaut : true) */
  showBack?: boolean;
  /** Bandeau logo CLINIX (défaut : false sur écrans secondaires) */
  showBrand?: boolean;
}

/** En-tête — même barre que Personnel (menu · logo · notif · profil, ou retour). */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  showBack = true,
  showBrand = true,
}: ScreenHeaderProps): React.JSX.Element | null {
  const layoutHeaderEnabled = usePageHeaderStore((s) => s.layoutHeaderEnabled);

  usePageHeader({
    title,
    subtitle,
    showBack,
    onBack,
    showBrand,
    showMenu: !showBack,
    showNotifications: true,
    showProfil: true,
    right,
  });

  if (layoutHeaderEnabled) return null;

  return (
    <LunaHeroHeader
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      onBack={onBack}
      showBrand={showBrand}
      showMenu={!showBack}
      showNotifications
      showProfil
      right={right}
    />
  );
}
