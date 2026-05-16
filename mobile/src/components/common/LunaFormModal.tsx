import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { lunaModalStyles as s } from '@/src/theme/lunaModal';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

export interface LunaFormModalProps {
  visible: boolean;
  title: string;
  icon?: IonIcon;
  children: React.ReactNode;
  submitLabel: string;
  cancelLabel?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitError?: string | null;
  sheet?: boolean;
}

export function LunaFormModal({
  visible,
  title,
  icon = 'document-text-outline',
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
            <Ionicons name={icon} size={22} color={LUNA_COLORS.tertiary} />
            <Text style={s.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.tertiary} />
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
            <Pressable style={s.btnGhost} onPress={onClose}>
              <Text style={s.btnGhostTxt}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[s.btnPrimary, submitting && { opacity: 0.5 }]}
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
}
