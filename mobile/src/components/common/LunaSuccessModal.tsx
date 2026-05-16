import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface LunaSuccessModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  /** Fermeture automatique (ms). 0 = désactivé. */
  autoCloseMs?: number;
}

export function LunaSuccessModal({
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

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.badge}>
            <Ionicons name="checkmark" size={44} color={LUNA_COLORS.textInverse} />
            <Text style={styles.badgeLabel}>SUCCESS</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.okBtn} onPress={onClose}>
            <Text style={styles.okTxt}>OK</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
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
  },
  badgeLabel: {
    marginTop: 2,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
    letterSpacing: 1.2,
  },
  message: {
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  okBtn: {
    marginTop: spacing.sm,
    backgroundColor: LUNA_COLORS.tertiary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  okTxt: {
    color: LUNA_COLORS.textInverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
});
