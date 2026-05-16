import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { lunaModalStyles as s } from '@/src/theme/lunaModal';

type IonIcon = ComponentProps<typeof Ionicons>['name'];

export interface LunaDetailsModalProps {
  visible: boolean;
  title: string;
  icon?: IonIcon;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
}

export function LunaDetailsModal({
  visible,
  title,
  icon = 'information-circle-outline',
  children,
  onClose,
  closeLabel = 'Fermer',
}: LunaDetailsModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlayCenter} onPress={onClose}>
        <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <Ionicons name={icon} size={22} color={LUNA_COLORS.textInverse} />
            <Text style={s.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={LUNA_COLORS.textInverse} />
            </Pressable>
          </View>
          <ScrollView style={s.body}>{children}</ScrollView>
          <View style={s.footerSingle}>
            <Pressable style={s.btnCloseOnly} onPress={onClose}>
              <Text style={s.btnCloseOnlyTxt}>{closeLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
