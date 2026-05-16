import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClinixLogo } from '@/src/components/common/ClinixLogo';
import { APP_NAME } from '@/src/constants/branding';
import { getRoleMenu, type RoleMenuItem } from '@/src/constants/roleMenus';
import { roleLabels } from '@/src/constants/roles';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { useDrawerStore } from '@/src/store/drawer.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Menu latéral par rôle (style web / capture référence) */
export function RoleDrawer(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { open, closeDrawer } = useDrawerStore();
  const { logout } = useAuth();
  const role = useAuthStore((s) => s.role);
  const prenom = useAuthStore((s) => s.prenom);
  const nom = useAuthStore((s) => s.nom);
  const cliniqueId = useAuthStore((s) => s.cliniqueId);

  const userName = [prenom, nom].filter(Boolean).join(' ').trim() || 'Utilisateur';
  const roleLabel = role ? (roleLabels[role] ?? role.replace('ROLE_', '')) : '';
  const items = getRoleMenu(role).filter(
    (i) => !i.route.endsWith('/menu') && !i.label.toLowerCase().includes('profil'),
  );

  function navigate(item: RoleMenuItem) {
    closeDrawer();
    router.push(item.route as never);
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.headerAvatar}>
              <ClinixLogo variant="icon" width={44} height={44} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.clinicLine} numberOfLines={1}>
                {APP_NAME}
                {cliniqueId != null ? ` · Clinique ${cliniqueId}` : ''}
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
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable
                key={item.route}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => navigate(item)}
              >
                <Ionicons name={item.icon} size={22} color={LUNA_COLORS.secondary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              style={styles.footerRow}
              onPress={() => {
                closeDrawer();
                void logout();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color={LUNA_COLORS.secondary} />
              <Text style={styles.footerLabel}>Déconnexion</Text>
            </Pressable>
            <Pressable style={styles.footerRow} onPress={closeDrawer}>
              <Ionicons name="close-circle-outline" size={22} color={LUNA_COLORS.secondary} />
              <Text style={styles.footerLabel}>Fermer tout</Text>
            </Pressable>
            <Pressable style={styles.helpRow} onPress={closeDrawer}>
              <Ionicons name="help-circle-outline" size={20} color={LUNA_COLORS.textDisabled} />
              <Text style={styles.helpLabel}>Aide & Formation</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
  },
  panel: {
    width: '78%',
    maxWidth: 300,
    backgroundColor: LUNA_COLORS.surface,
    shadowColor: LUNA_COLORS.darkest,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: LUNA_COLORS.primary,
    gap: spacing.md,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerText: { flex: 1 },
  clinicLine: {
    fontSize: fontSize.base,
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
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
  },
  rowPressed: { backgroundColor: LUNA_COLORS.surfaceLight },
  rowLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.secondary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.borderDark,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.secondary,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  helpLabel: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textDisabled,
  },
});
