import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinixLogo } from '@/src/components/common/ClinixLogo';
import { APP_TAGLINE, getProfilRoute } from '@/src/constants/branding';
import { roleLabels } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';
import { useDrawerStore } from '@/src/store/drawer.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface LunaHeroHeaderProps {
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
  children?: React.ReactNode;
}

/** Barre supérieure type web : menu · logo · notifications · profil */
export function LunaHeroHeader({
  title,
  subtitle,
  showBrand = true,
  showMenu = true,
  showNotifications = true,
  showProfil = true,
  showBack = false,
  onBack,
  right,
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
        ) : showMenu && showBrand ? (
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

        {showBrand ? (
          <Pressable onPress={openDrawer} style={styles.logoTap} accessibilityLabel="CLINIX">
            <ClinixLogo variant="icon" width={32} height={32} />
          </Pressable>
        ) : null}

        <View style={styles.spacer} />

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

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: LUNA_COLORS.secondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  iconPlaceholder: { width: 44 },
  logoTap: {
    marginLeft: spacing.xs,
  },
  spacer: { flex: 1 },
  titleRow: {
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  textCol: { flex: 1 },
  pageTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  pageSub: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 1,
  },
  tagline: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  rightSlot: {
    marginRight: spacing.xs,
  },
  children: { marginTop: spacing.md },
});
