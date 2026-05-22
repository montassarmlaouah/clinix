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
import { getRoleMenu, type RoleMenuItem } from '@/src/constants/roleMenus';
import { roleLabels } from '@/src/constants/roles';
import { useAuth } from '@/src/hooks/useAuth';
import { useCliniqueNom } from '@/src/hooks/useCliniqueNom';
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
  const estCabinet = useAuthStore((s) => s.estCabinet);
  const accesCabinet = useAuthStore((s) => s.accesCabinet);
  const cliniqueNom = useCliniqueNom();

  const userName = [prenom, nom].filter(Boolean).join(' ').trim() || 'Utilisateur';
  const roleLabel = role ? (roleLabels[role] ?? role.replace('ROLE_', '')) : '';
  const cliniqueId = useAuthStore((s) => s.cliniqueId);
  const items = getRoleMenu(role, { estCabinet, accesCabinet, cliniqueId }).filter(
    (i) => !i.route.endsWith('/menu') && !i.label.toLowerCase().includes('profil'),
  );

  function navigate(item: RoleMenuItem) {
    closeDrawer();
    router.navigate(item.route as never);
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerAvatar}>
              <ClinixLogo variant="icon" width={44} height={44} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                CLINIX
              </Text>
              {cliniqueNom ? (
                <Text style={styles.clinicLine} numberOfLines={1}>
                  {cliniqueNom}
                </Text>
              ) : null}
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
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} // ✨ opacity 0.75
                onPress={() => navigate(item)}
              >
                <Ionicons name={item.icon} size={22} color={LUNA_COLORS.secondary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              style={({ pressed }) => [styles.footerRow, pressed && { opacity: 0.75 }]} // ✨
              onPress={() => {
                closeDrawer();
                void logout();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color={LUNA_COLORS.secondary} />
              <Text style={styles.footerLabel}>Déconnexion</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.helpRow, pressed && { opacity: 0.75 }]} // ✨
              onPress={closeDrawer}
            >
              <Ionicons name="help-circle-outline" size={20} color={LUNA_COLORS.textDisabled} />
              <Text style={styles.helpLabel}>Aide & Formation</Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          style={styles.backdrop}
          onPress={closeDrawer}
          accessibilityLabel="Fermer le menu"
        />
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
    zIndex: 1,
  },
  panel: {
    width: '78%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: LUNA_COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: LUNA_COLORS.borderSubtle, // ✨
    shadowColor: LUNA_COLORS.darkest,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 2,
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
  brandTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse, // ✨ sur fond primary
  },
  clinicLine: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)', // ✨
    marginTop: 2,
  },
  userLine: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textInverse, // ✨
    marginTop: 2,
  },
  roleLine: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)', // ✨
    marginTop: 2,
  },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)', // ✨ séparateur
  },
  rowPressed: { backgroundColor: LUNA_COLORS.surfaceLight, opacity: 0.75 }, // ✨
  rowLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.secondary,
    textAlign: 'left',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨
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
