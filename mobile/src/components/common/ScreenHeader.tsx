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

/** En-tête secondaire — style navbar web (teal + retour) */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  showBack = true,
  showBrand = false,
}: ScreenHeaderProps): React.JSX.Element {
  return (
    <LunaHeroHeader
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      onBack={onBack}
      showBrand={showBrand}
      showMenu={!showBack}
      showNotifications={false}
      showProfil={false}
      right={right}
    />
  );
}
