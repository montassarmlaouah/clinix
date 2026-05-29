import type { ComponentProps } from 'react';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { IconInfoCircle, IconX } from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { lunaModalStyles as s } from '@/src/theme/lunaModal';

type TablerIconComponent = React.FC<ComponentProps<typeof IconInfoCircle>>;

export interface LunaDetailsModalProps {
  visible: boolean;
  title: string;
  icon?: TablerIconComponent;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
}

export const LunaDetailsModal = React.memo(function LunaDetailsModal({
  visible,
  title,
  icon: Icon = IconInfoCircle,
  children,
  onClose,
  closeLabel = 'Fermer',
}: LunaDetailsModalProps): React.JSX.Element {
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
          <ScrollView style={s.body}>{children}</ScrollView>
          <View style={s.footerSingle}>
            <Pressable style={({ pressed }) => [s.btnCloseOnly, pressed && { opacity: 0.75 }]} onPress={onClose}>
              <Text style={s.btnCloseOnlyTxt}>{closeLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});
