import React from 'react';
import { type ViewStyle } from 'react-native';

import { LunaHeroHeader } from '@/src/components/common/LunaHeroHeader';
import { LunaScreen } from '@/src/components/common/LunaScreen';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';

export interface AppPageShellProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBrand?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  showProfil?: boolean;
  right?: React.ReactNode;
  headerChildren?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Enveloppe standard : barre supérieure LUNA (comme Personnel) + contenu.
 * La barre du bas reste visible via le layout Tabs parent.
 */
export function AppPageShell({
  title,
  subtitle,
  showBack = false,
  onBack,
  showBrand = true,
  showMenu,
  showNotifications = true,
  showProfil = true,
  right,
  headerChildren,
  children,
  style,
}: AppPageShellProps): React.JSX.Element {
  const layoutHeaderEnabled = usePageHeaderStore((s) => s.layoutHeaderEnabled);

  usePageHeader({
    title,
    subtitle,
    showBack,
    onBack,
    showBrand,
    showMenu: showMenu ?? !showBack,
    showNotifications,
    showProfil,
    right,
  });

  return (
    <LunaScreen edges={[]} style={style}>
      {!layoutHeaderEnabled ? (
        <LunaHeroHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBack={onBack}
          showBrand={showBrand}
          showMenu={showMenu ?? !showBack}
          showNotifications={showNotifications}
          showProfil={showProfil}
          right={right}
        >
          {headerChildren}
        </LunaHeroHeader>
      ) : null}
      {children}
    </LunaScreen>
  );
}
