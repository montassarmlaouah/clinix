import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinixLogo } from '@/src/components/common/ClinixLogo';
import { APP_NAME, getProfilRoute } from '@/src/constants/branding';
import { roleLabels } from '@/src/constants/roles';
import { useCliniqueNom } from '@/src/hooks/useCliniqueNom';
import { useAuthStore } from '@/src/store/auth.store';
import { useDrawerStore } from '@/src/store/drawer.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const MENU_ICON_BASE = 26;
const MENU_SCALE = 1.75;
const MENU_ICON_SIZE = Math.round(MENU_ICON_BASE * MENU_SCALE);
const MENU_BTN_SIZE = Math.round(44 * MENU_SCALE);

export interface LunaAccessHeaderProps {
  /** Titre de la page sous la bande accès (ex. « Chambres ») */
  pageTitle?: string;
  pageSubtitle?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
  showProfil?: boolean;
  right?: React.ReactNode;
}

/** En-tête admin aligné sur le menu latéral (bandeau CLINIX + utilisateur). */
export function LunaAccessHeader({
  pageTitle,
  pageSubtitle,
  showMenu = true,
  showNotifications = true,
  showProfil = true,
  right,
}: LunaAccessHeaderProps): React.JSX.Element {
  const router = useRouter();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const role = useAuthStore((s) => s.role);
  const prenom = useAuthStore((s) => s.prenom);
  const nom = useAuthStore((s) => s.nom);
  const cliniqueNom = useCliniqueNom();

  const userName = [prenom, nom].filter(Boolean).join(' ').trim() || 'Utilisateur';
  const roleLabel = role ? (roleLabels[role] ?? role.replace('ROLE_', '')) : '';
  const clinicLine = cliniqueNom ? `${APP_NAME} – ${cliniqueNom}` : APP_NAME;

  return (
    <View style={styles.wrap}>
      <View style={styles.accessBand}>
        {showMenu ? (
          <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={8} accessibilityLabel="Menu">
            <Ionicons name="menu" size={MENU_ICON_SIZE} color={LUNA_COLORS.darkest} />
          </Pressable>
        ) : (
          <View style={[styles.menuPlaceholder, { width: MENU_BTN_SIZE, height: MENU_BTN_SIZE }]} />
        )}

        <View style={styles.logoCircle}>
          <ClinixLogo variant="icon" width={44} height={44} />
        </View>

        <View style={styles.identity}>
          <Text style={styles.clinicLine} numberOfLines={1}>
            {clinicLine}
          </Text>
          <Text style={styles.userLine} numberOfLines={1}>
            {userName}
          </Text>
          {roleLabel ? (
            <Text style={styles.roleLine} numberOfLines={1}>
              {roleLabel}
            </Text>
          ) : null}
        </View>

        {right ? <View style={styles.rightSlot}>{right}</View> : null}

        {showNotifications ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as never)}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={LUNA_COLORS.tertiary} />
          </Pressable>
        ) : null}

        {showProfil ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push(getProfilRoute(role) as never)}
            accessibilityLabel="Profil"
          >
            <Ionicons name="person-circle-outline" size={24} color={LUNA_COLORS.tertiary} />
          </Pressable>
        ) : null}
      </View>

      {pageTitle ? (
        <View style={styles.pageBand}>
          <View style={styles.pageTextCol}>
            <Text style={styles.pageTitle} numberOfLines={1}>
              {pageTitle}
            </Text>
            {pageSubtitle ? (
              <Text style={styles.pageSubtitle} numberOfLines={2}>
                {pageSubtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  accessBand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.primary,
    gap: spacing.sm,
  },
  menuBtn: {
    width: MENU_BTN_SIZE,
    height: MENU_BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  menuPlaceholder: {},
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  identity: { flex: 1, minWidth: 0 },
  clinicLine: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
  },
  userLine: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.dark,
    marginTop: 2,
  },
  roleLine: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.tertiary,
    marginTop: 2,
  },
  rightSlot: { marginLeft: spacing.xs },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBand: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
  },
  pageTextCol: { flex: 1 },
  pageTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
  },
  pageSubtitle: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
});
