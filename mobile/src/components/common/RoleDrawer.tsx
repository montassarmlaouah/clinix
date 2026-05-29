import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconPlane,
  IconAlertCircle,
  IconBandage,
  IconBed,
  IconCalendar,
  IconCreditCard,
  IconCheckbox,
  IconClipboardList,
  IconDeviceMobileMessage,
  IconFileText,
  IconHeart,
  IconHelpCircle,
  IconHome,
  IconId,
  IconList,
  IconLogout,
  IconMedicalCross,
  IconMenu2,
  IconNotes,
  IconPackage,
  IconPill,
  IconReportMedical,
  IconScan,
  IconSettings,
  IconGauge,
  IconStethoscope,
  IconCalendarTime,
  IconTools,
  IconUser,
  IconUsers,
  IconVaccine,
  IconVideo,
  IconAlertTriangle,
  type Icon as TablerIcon,
} from '@tabler/icons-react-native';

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

const IONICON_TO_TABLER: Record<string, TablerIcon> = {
  'speedometer-outline': IconGauge,
  'business-outline': IconHome,
  'person-outline': IconUser,
  'card-outline': IconCreditCard,
  'settings-outline': IconSettings,
  'people-outline': IconUsers,
  'medical-outline': IconMedicalCross,
  'bed-outline': IconBed,
  'construct-outline': IconTools,
  'grid-outline': IconHome,
  'heart-outline': IconHeart,
  'receipt-outline': IconFileText,
  'calendar-outline': IconCalendar,
  'airplane-outline': IconPlane,
  'medkit-outline': IconPill,
  'list-outline': IconList,
  'pulse-outline': IconStethoscope,
  'today-outline': IconCalendarTime,
  'warning-outline': IconAlertTriangle,
  'alert-circle-outline': IconAlertCircle,
  'bandage-outline': IconBandage,
  'scan-outline': IconScan,
  'time-outline': IconStethoscope,
  'checkbox-outline': IconCheckbox,
  'analytics-outline': IconNotes,
  'chatbox-outline': IconDeviceMobileMessage,
  'document-text-outline': IconFileText,
  'chatbubbles-outline': IconDeviceMobileMessage,
  'clipboard-outline': IconClipboardList,
  'folder-open-outline': IconFileText,
  'flask-outline': IconVaccine,
  'videocam-outline': IconVideo,
  'notifications-outline': IconAlertCircle,
  'person-circle-outline': IconId,
  'menu-outline': IconMenu2,
  'home-outline': IconHome,
  'cut-outline': IconMedicalCross,
  'lock-closed-outline': IconSettings,
  'help-circle-outline': IconHelpCircle,
  'log-out-outline': IconLogout,
  'arrow-back-outline': IconMenu2,
  'eye-outline': IconMenu2,
  'eye-off-outline': IconMenu2,
  'chevron-up': IconMenu2,
  'chevron-down': IconMenu2,
  'crown-outline': IconMenu2,
  'barcode-outline': IconMenu2,
  'id-card-outline': IconId,
  'mail-outline': IconMenu2,
  'call-outline': IconMenu2,
  'add-outline': IconMenu2,
  'pencil-outline': IconMenu2,
  'trash-outline': IconMenu2,
  'search-outline': IconMenu2,
  'filter-outline': IconMenu2,
  'download-outline': IconMenu2,
  'upload-outline': IconMenu2,
  'print-outline': IconMenu2,
  'share-outline': IconMenu2,
};

function resolveMenuIcon(iconName: string): TablerIcon {
  return IONICON_TO_TABLER[iconName] ?? IconMenu2;
}

// ✨ Fonction interne optimisée avant memo
function RoleDrawerComponent(): React.JSX.Element {
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

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: LUNA_COLORS.primary,
    gap: spacing.md,
  };

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)',
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View
          style={{
            width: '78%',
            maxWidth: 300,
            height: '100%',
            backgroundColor: LUNA_COLORS.surface,
            borderRightWidth: 1,
            borderRightColor: LUNA_COLORS.borderSubtle,
            shadowColor: LUNA_COLORS.darkest,
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 10,
            zIndex: 2,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          <View style={headerStyle}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: borderRadius.full,
                backgroundColor: LUNA_COLORS.surface,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <ClinixLogo variant="icon" width={44} height={44} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse }} numberOfLines={1}>
                CLINIX
              </Text>
              {cliniqueNom ? (
                <Text style={{ fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 }} numberOfLines={1}>
                  {cliniqueNom}
                </Text>
              ) : null}
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textInverse, marginTop: 2 }} numberOfLines={1}>
                {userName}
              </Text>
              {roleLabel ? (
                <Text style={{ fontSize: fontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 }} numberOfLines={1}>
                  {roleLabel}
                </Text>
              ) : null}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const ItemIcon = resolveMenuIcon(item.icon);
              return (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    rowStyle,
                    pressed && { backgroundColor: LUNA_COLORS.surfaceLight, opacity: 0.75 },
                  ]}
                  onPress={() => navigate(item)}
                >
                  <ItemIcon size={20} color={LUNA_COLORS.secondary} strokeWidth={1.8} />
                  <Text style={{ flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.medium, color: LUNA_COLORS.secondary, textAlign: 'left' }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: 'rgba(197, 220, 234, 0.6)',
              paddingTop: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            }}
          >
            <Pressable
              style={({ pressed }) => [
                { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => {
                closeDrawer();
                void logout();
              }}
            >
              <IconLogout size={20} color={LUNA_COLORS.secondary} strokeWidth={1.8} />
              <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: LUNA_COLORS.secondary }}>
                Déconnexion
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.xs },
                pressed && { opacity: 0.75 },
              ]}
              onPress={closeDrawer}
            >
              <IconHelpCircle size={18} color={LUNA_COLORS.textDisabled} strokeWidth={1.8} />
              <Text style={{ fontSize: fontSize.sm, color: LUNA_COLORS.textDisabled }}>
                Aide & Formation
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          style={{ flex: 1, backgroundColor: LUNA_COLORS.overlay, zIndex: 1 }}
          onPress={closeDrawer}
          accessibilityLabel="Fermer le menu"
        />
      </View>
    </Modal>
  );
}

// ✨ Export mémoized pour éviter rerenders parents
export const RoleDrawer = React.memo(RoleDrawerComponent);
