import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { ClinixLogo } from '@/src/components/common/ClinixLogo';
import { APP_TAGLINE, getProfilRoute } from '@/src/constants/branding';
import { roleLabels } from '@/src/constants/roles';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { useDrawerStore } from '@/src/store/drawer.store';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';
import {
  IconArrowLeft,
  IconBell,
  IconMenu2,
  IconUser,
} from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface LunaHeroHeaderProps {
  title: string;
  subtitle?: string;
  showBrand?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  showProfil?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  center?: React.ReactNode;
  children?: React.ReactNode;
}

export function LunaHeroHeaderView({
  title,
  subtitle,
  showBrand = true,
  showMenu = true,
  showNotifications = true,
  showProfil = true,
  showBack = false,
  onBack,
  right,
  center,
  children,
}: LunaHeroHeaderProps): React.JSX.Element {
  const router = useRouter();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const role = useAuthStore((s) => s.role);
  const prenom = useAuthStore((s) => s.prenom);
  const nom = useAuthStore((s) => s.nom);
  const roleLabel = role ? (roleLabels[role] ?? role.replace('ROLE_', '')) : '';

  const userLine = [prenom, nom].filter(Boolean).join(' ').trim() || roleLabel;
  const line2 = subtitle ?? undefined;

  const iconBtnStyle: ViewStyle = {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  };

  return (
    <View
      style={{
        backgroundColor: LUNA_COLORS.primary,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundColor: LUNA_COLORS.secondary,
          opacity: 0.45,
        }}
        pointerEvents="none"
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, minHeight: 48 }}>
        {showBack ? (
          <Pressable
            style={iconBtnStyle}
            onPress={onBack ?? (() => router.back())}
            hitSlop={8}
            accessibilityLabel="Retour"
          >
            <IconArrowLeft size={22} color={LUNA_COLORS.textInverse} strokeWidth={2} />
          </Pressable>
        ) : showMenu ? (
          <Pressable
            style={iconBtnStyle}
            onPress={openDrawer}
            hitSlop={8}
            accessibilityLabel="Ouvrir le menu"
          >
            <IconMenu2 size={22} color={LUNA_COLORS.textInverse} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}

        {center ? (
          <View style={{ flex: 1, minWidth: 0, marginHorizontal: spacing.xs, justifyContent: 'center' }}>
            {center}
          </View>
        ) : showBrand ? (
          <>
            <Pressable
              onPress={openDrawer}
              style={{ marginTop: 6, marginLeft: spacing.xs }}
              accessibilityLabel="CLINIX"
            >
              <ClinixLogo variant="icon" width={32} height={32} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0, paddingLeft: spacing.xs, paddingTop: 2 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse }} numberOfLines={1}>
                  {title}
                </Text>
                {line2 ? (
                  <Text style={{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.90)', marginTop: 2 }} numberOfLines={1}>
                    {line2}
                  </Text>
                ) : showBrand && !subtitle && userLine ? (
                  <Text style={{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.90)', marginTop: 2 }} numberOfLines={1}>
                    {userLine}
                  </Text>
                ) : null}
                {showBrand && !subtitle && !line2 ? (
                  <Text style={{ fontSize: fontSize.xs, color: 'rgba(255,255,255,0.70)', marginTop: 2 }} numberOfLines={1}>
                    {APP_TAGLINE}
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, minWidth: 0, paddingLeft: spacing.xs, paddingTop: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse }} numberOfLines={1}>
                {title}
              </Text>
              {line2 ? (
                <Text style={{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.90)', marginTop: 2 }} numberOfLines={1}>
                  {line2}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {right ? <View style={{ marginRight: spacing.xs }}>{right}</View> : null}

        {showNotifications ? (
          <Pressable
            style={iconBtnStyle}
            onPress={() => router.push('/notifications' as never)}
            accessibilityLabel="Notifications"
          >
            <IconBell size={20} color={LUNA_COLORS.textInverse} strokeWidth={2} />
          </Pressable>
        ) : null}

        {showProfil ? (
          <Pressable
            style={iconBtnStyle}
            onPress={() => router.push(getProfilRoute(role) as never)}
            accessibilityLabel="Profil"
          >
            <IconUser size={20} color={LUNA_COLORS.textInverse} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {children ? <View style={{ marginTop: spacing.md }}>{children}</View> : null}
    </View>
  );
}

export function LunaHeroHeader(props: LunaHeroHeaderProps): React.JSX.Element | null {
  const layoutHeaderEnabled = usePageHeaderStore((s) => s.layoutHeaderEnabled);

  usePageHeader({
    title: props.title,
    subtitle: props.subtitle,
    showMenu: (props.showMenu ?? true) && !(props.showBack ?? false),
    showBack: props.showBack,
    onBack: props.onBack,
    showBrand: props.showBrand,
    showNotifications: props.showNotifications,
    showProfil: props.showProfil,
    right: props.right,
    center: props.center,
  });

  if (layoutHeaderEnabled) return null;

  return <LunaHeroHeaderView {...props} />;
}
