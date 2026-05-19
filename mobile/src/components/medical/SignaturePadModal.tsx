import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface SignaturePadModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with a synthetic hash string when user confirms */
  onConfirm: (hash: string) => void;
  loading?: boolean;
  title?: string;
}

/**
 * Modal de signature électronique.
 * Note : React Native ne dispose pas d'un canvas web. On simule la signature
 * avec un composant d'avertissement + confirmation manuelle. Pour une vraie
 * signature tactile, installer react-native-signature-canvas (natif).
 * Le hash est généré côté backend lors de l'appel /signer.
 */
export function SignaturePadModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
  title = 'Signature électronique',
}: SignaturePadModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!confirmed) {
      Alert.alert(
        'Confirmation requise',
        'Veuillez cocher la case pour confirmer votre signature.',
      );
      return;
    }
    // The actual hash is computed server-side; pass a placeholder
    onConfirm('client-confirmed');
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          {/* Zone signature symbolique */}
          <View style={styles.padArea}>
            <Text style={styles.padIcon}>✍️</Text>
            <Text style={styles.padText}>
              En confirmant, vous apposez votre signature électronique sur ce document.
              Un hash SHA-256 sera généré par le serveur pour garantir l'intégrité.
            </Text>
          </View>

          {/* Checkbox confirmation */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setConfirmed(c => !c)}
            activeOpacity={0.75} // ✨
          >
            <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
              {confirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              J'ai vérifié le contenu et je confirme ma signature
            </Text>
          </TouchableOpacity>

          {/* Boutons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, (!confirmed || loading) && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={!confirmed || loading}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmText}>
                {loading ? 'Signature...' : 'Signer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl, // ✨
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold as any,
    color: LUNA_COLORS.dark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  padArea: {
    backgroundColor: LUNA_COLORS.inputBg, // ✨
    borderRadius: borderRadius.lg, // ✨
    borderWidth: 2,
    borderColor: LUNA_COLORS.borderInput, // ✨
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: 120,
    justifyContent: 'center',
  },
  padIcon: { fontSize: 40, marginBottom: spacing.sm },
  padText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: LUNA_COLORS.secondary, borderColor: LUNA_COLORS.secondary },
  checkmark: { color: LUNA_COLORS.surface, fontSize: 14, fontWeight: fontWeight.bold as any },
  checkLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    lineHeight: 20,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.full, // ✨
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
    alignItems: 'center',
  },
  cancelText: { color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.medium as any },
  confirmBtn: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.full, // ✨
    backgroundColor: LUNA_COLORS.secondary, // ✨
    alignItems: 'center',
  },
  confirmText: { color: LUNA_COLORS.surface, fontWeight: fontWeight.bold as any, fontSize: fontSize.md },
  btnDisabled: { opacity: 0.5 },
});
