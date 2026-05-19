import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinixLogo } from '@/src/components/common/ClinixLogo';
import { APP_TAGLINE, getProfilRoute } from '@/src/constants/branding';
import { roleLabels } from '@/src/constants/roles';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { useDrawerStore } from '@/src/store/drawer.store';
import { usePageHeaderStore } from '@/src/store/pageHeader.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface LunaHeroHeaderProps {
  title: string;
  subtitle?: string;
  showBrand?: boolean;
  /** Menu hamburger (navigation par rôle) */
  showMenu?: boolean;
  showNotifications?: boolean;
  showProfil?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  center?: React.ReactNode;
  children?: React.ReactNode;
}

/** Rendu visuel de la barre supérieure (sans hook store). */
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

  return (
    <View style={styles.wrap}>
      <View style={styles.gradientFade} pointerEvents="none" />
      <View style={styles.navRow}>
        {showBack ? (
          <Pressable
            style={styles.iconBtn}
            onPress={onBack ?? (() => router.back())}
            hitSlop={8}
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={24} color={LUNA_COLORS.textInverse} />
          </Pressable>
        ) : showMenu ? (
          <Pressable
            style={styles.iconBtn}
            onPress={openDrawer}
            hitSlop={8}
            accessibilityLabel="Ouvrir le menu"
          >
            <Ionicons name="menu" size={24} color={LUNA_COLORS.textInverse} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {center ? (
          <View style={styles.centerSlot}>{center}</View>
        ) : showBrand ? (
          <>
            <Pressable onPress={openDrawer} style={styles.logoTap} accessibilityLabel="CLINIX">
              <ClinixLogo variant="icon" width={32} height={32} />
            </Pressable>
            <View style={styles.titleRow}>
              <View style={styles.textCol}>
                <Text style={styles.pageTitle} numberOfLines={1}>
                  {title}
                </Text>
                {line2 ? (
                  <Text style={styles.pageSub} numberOfLines={1}>
                    {line2}
                  </Text>
                ) : showBrand && !subtitle && userLine ? (
                  <Text style={styles.pageSub} numberOfLines={1}>
                    {userLine}
                  </Text>
                ) : null}
                {showBrand && !subtitle && !line2 ? (
                  <Text style={styles.tagline} numberOfLines={1}>
                    {APP_TAGLINE}
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.titleRow}>
            <View style={styles.textCol}>
              <Text style={styles.pageTitle} numberOfLines={1}>
                {title}
              </Text>
              {line2 ? (
                <Text style={styles.pageSub} numberOfLines={1}>
                  {line2}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {right ? <View style={styles.rightSlot}>{right}</View> : null}

        {showNotifications ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as never)}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
        ) : null}

        {showProfil ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push(getProfilRoute(role) as never)}
            accessibilityLabel="Profil"
          >
            <Ionicons name="person-outline" size={22} color={LUNA_COLORS.textInverse} />
          </Pressable>
        ) : null}
      </View>

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

/** Barre supérieure type web : menu · logo · notifications · profil */
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

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: LUNA_COLORS.primary, // ✨ fond primary avec fade secondary
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  gradientFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '55%',
    backgroundColor: LUNA_COLORS.secondary,
    opacity: 0.45,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    minHeight: 48,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)', // ✨ boutons semi-transparents
  },
  iconPlaceholder: { width: 44 },
  logoTap: {
    marginTop: 6,
    marginLeft: spacing.xs,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    paddingLeft: spacing.xs,
    paddingTop: 2,
  },
  textCol: { flex: 1 },
  pageTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  pageSub: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.90)',
    marginTop: 2,
  },
  tagline: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.70)',
    marginTop: 2,
  },
  rightSlot: {
    marginRight: spacing.xs,
  },
  centerSlot: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  children: { marginTop: spacing.md },
});
