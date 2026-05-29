import React, { useEffect } from 'react';
import { Modal, Pressable, Text, View, type ViewStyle } from 'react-native';
import { IconCheck } from '@tabler/icons-react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface LunaSuccessModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export const LunaSuccessModal = React.memo(function LunaSuccessModal({
  visible,
  message,
  onClose,
  autoCloseMs = 0,
}: LunaSuccessModalProps): React.JSX.Element {
  useEffect(() => {
    if (!visible || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [visible, autoCloseMs, onClose]);

  const backdropStyle: ViewStyle = {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  };

  const cardStyle: ViewStyle = {
    width: '100%',
    maxWidth: 320,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  };

  const badgeStyle: ViewStyle = {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: LUNA_COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  };

  const okBtnStyle: ViewStyle = {
    marginTop: spacing.sm,
    backgroundColor: LUNA_COLORS.secondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 120,
    alignItems: 'center',
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={backdropStyle} onPress={onClose}>
        <Pressable style={cardStyle} onPress={(e) => e.stopPropagation()}>
          <View style={badgeStyle}>
            <IconCheck size={44} color={LUNA_COLORS.textInverse} strokeWidth={2.5} />
            <Text
              style={{
                marginTop: 2,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.bold,
                color: LUNA_COLORS.textInverse,
                letterSpacing: 1.2,
              }}
            >
              SUCCESS
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, textAlign: 'center', lineHeight: 22 }}>
            {message}
          </Text>
          <Pressable style={({ pressed }) => [okBtnStyle, pressed && { opacity: 0.75 }]} onPress={onClose}>
            <Text style={{ color: LUNA_COLORS.textInverse, fontWeight: fontWeight.semibold, fontSize: fontSize.base }}>
              OK
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
});
