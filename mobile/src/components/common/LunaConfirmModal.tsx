import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { lunaModalStyles as s } from '@/src/theme/lunaModal';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

export interface LunaConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: IonIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  error?: string | null;
}

export function LunaConfirmModal({
  visible,
  title,
  message,
  icon = 'warning-outline',
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
            <Ionicons name={icon} size={22} color={LUNA_COLORS.tertiary} />
            <Text style={s.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.tertiary} />
            </Pressable>
          </View>
          <View style={[s.body, { alignItems: 'center', gap: 12 }]}>
            <Ionicons name={icon} size={48} color={LUNA_COLORS.warning} />
            <Text style={{ fontSize: 15, color: LUNA_COLORS.textPrimary, textAlign: 'center' }}>
              {message}
            </Text>
            {error ? <Text style={s.errTxt}>{error}</Text> : null}
          </View>
          <View style={s.footer}>
            <Pressable style={s.btnGhost} onPress={onClose}>
              <Text style={s.btnGhostTxt}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[s.btnDanger, submitting && { opacity: 0.5 }]}
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
}
