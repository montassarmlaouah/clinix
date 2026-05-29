import type { ComponentProps } from 'react';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { IconAlertTriangle, IconX } from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { lunaModalStyles as s } from '@/src/theme/lunaModal';

type TablerIconComponent = React.FC<ComponentProps<typeof IconAlertTriangle>>;

export interface LunaConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: TablerIconComponent;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  error?: string | null;
}

export const LunaConfirmModal = React.memo(function LunaConfirmModal({
  visible,
  title,
  message,
  icon: Icon = IconAlertTriangle,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}: LunaConfirmModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlayCenter} onPress={onClose}>
        <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <Icon size={20} color={LUNA_COLORS.tertiary} strokeWidth={1.8} />
            <Text style={s.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.75 }}>
              <IconX size={22} color={LUNA_COLORS.tertiary} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={[s.body, { alignItems: 'center', gap: 12 }]}>
            <Icon size={48} color={LUNA_COLORS.warning} strokeWidth={1.5} />
            <Text style={{ fontSize: 15, color: LUNA_COLORS.textPrimary, textAlign: 'center' }}>
              {message}
            </Text>
            {error ? <Text style={s.errTxt}>{error}</Text> : null}
          </View>
          <View style={s.footer}>
            <Pressable style={({ pressed }) => [s.btnGhost, pressed && { opacity: 0.75 }]} onPress={onClose}>
              <Text style={s.btnGhostTxt}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.btnDanger, submitting && { opacity: 0.5 }, pressed && { opacity: 0.75 }]}
              onPress={onConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={LUNA_COLORS.textInverse} />
              ) : (
                <Text style={s.btnPrimaryTxt}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});
