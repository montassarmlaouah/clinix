import { useSegments } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LunaHeroHeaderView } from '@/src/components/common/LunaHeroHeader';
import { getDefaultPageTitle } from '@/src/constants/pageTitles';
import { roleLabels } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';
import { LUNA_COLORS } from '@/src/theme/colors';

interface RoleTabsShellProps {
  children: React.ReactNode;
}

function RoleTabsShellComponent({ children }: RoleTabsShellProps): React.JSX.Element {
  const segments = useSegments() as string[];
  const role = useAuthStore((s) => s.role);
  const roleLabel = role ? (roleLabels[role] ?? role.replace('ROLE_', '')) : '';

  const {
    title,
    subtitle,
    showMenu,
    showBack,
    showNotifications,
    showProfil,
    showBrand,
    right,
    center,
    onBack,
    setLayoutHeaderEnabled,
  } = usePageHeaderStore();

  useEffect(() => {
    setLayoutHeaderEnabled(true);
    return () => setLayoutHeaderEnabled(false);
  }, [setLayoutHeaderEnabled]);

  const routeDefaults = getDefaultPageTitle(segments);
  const displayTitle = title || routeDefaults.title;
  const displaySubtitle = subtitle ?? routeDefaults.subtitle ?? roleLabel;

  return (
    <View style={{ flex: 1, backgroundColor: LUNA_COLORS.background }}>
      <SafeAreaView style={{ backgroundColor: LUNA_COLORS.secondary }} edges={['top']}>
        <LunaHeroHeaderView
          title={displayTitle}
          subtitle={displaySubtitle}
          showMenu={showMenu ?? !showBack}
          showBack={showBack ?? false}
          onBack={onBack}
          showBrand={showBrand ?? true}
          showNotifications={showNotifications ?? true}
          showProfil={showProfil ?? true}
          right={right}
          center={center}
        />
      </SafeAreaView>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

// ✨ Memoized avec comparateur custom pour éviter rerenders inutiles
export const RoleTabsShell = React.memo(RoleTabsShellComponent, (prev, next) => {
  // Rerender uniquement si children change
  return prev.children === next.children;
});
