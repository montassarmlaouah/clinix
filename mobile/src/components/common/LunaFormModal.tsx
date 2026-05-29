import type { ComponentProps } from 'react';
import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { IconFileText, IconX } from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { lunaModalStyles as s } from '@/src/theme/lunaModal';

type TablerIconComponent = React.FC<ComponentProps<typeof IconFileText>>;

export interface LunaFormModalProps {
  visible: boolean;
  title: string;
  icon?: TablerIconComponent;
  children: React.ReactNode;
  submitLabel: string;
  cancelLabel?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitError?: string | null;
  sheet?: boolean;
}

export const LunaFormModal = React.memo(function LunaFormModal({
  visible,
  title,
  icon: Icon = IconFileText,
  children,
  submitLabel,
  cancelLabel = 'Annuler',
  onClose,
  onSubmit,
  submitting = false,
  submitError = null,
  sheet = true,
}: LunaFormModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={sheet ? s.overlaySheet : s.overlayCenter}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={sheet ? s.cardSheet : s.card}>
          <View style={s.header}>
            <Icon size={20} color={LUNA_COLORS.tertiary} strokeWidth={1.8} />
            <Text style={s.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.75 }}>
              <IconX size={22} color={LUNA_COLORS.tertiary} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            {children}
            {submitError ? (
              <View style={s.errBox}>
                <Text style={s.errTxt}>{submitError}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={s.footer}>
            <Pressable style={({ pressed }) => [s.btnGhost, pressed && { opacity: 0.75 }]} onPress={onClose}>
              <Text style={s.btnGhostTxt}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.btnPrimary, submitting && { opacity: 0.5 }, pressed && { opacity: 0.75 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={LUNA_COLORS.textInverse} />
              ) : (
                <Text style={s.btnPrimaryTxt}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});
