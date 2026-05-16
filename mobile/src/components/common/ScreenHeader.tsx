import React from 'react';

import { LunaHeroHeader } from '@/src/components/common/LunaHeroHeader';

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
}: ScreenHeaderProps): React.JSX.Element {
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
