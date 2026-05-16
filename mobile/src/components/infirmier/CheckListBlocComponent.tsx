import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface CheckListItem {
  id: string;
  libelle: string;
  checked: boolean;
  commentaire?: string;
  obligatoire: boolean;
  ordre: number;
}

interface Props {
  items: CheckListItem[];
  onChange: (itemId: string, checked: boolean, commentaire?: string) => void;
  disabled?: boolean;
}

export function CheckListBlocComponent({ items, onChange, disabled = false }: Props) {
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const progress = total > 0 ? checked / total : 0;

  const sortedItems = [...items].sort((a, b) => a.ordre - b.ordre);

  return (
    <View>
      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{checked}/{total}</Text>
      </View>

      {/* Items */}
      {sortedItems.map((item) => (
        <View key={item.id} style={[styles.item, item.checked && styles.itemChecked]}>
          <Pressable
            style={styles.itemRow}
            onPress={() => !disabled && onChange(item.id, !item.checked, item.commentaire)}
          >
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && (
                <Ionicons name="checkmark" size={14} color={LUNA_COLORS.surface} />
              )}
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemLabelRow}>
                <Text style={[styles.itemLabel, item.checked && styles.itemLabelDone]}>
                  {item.libelle}
                </Text>
                {item.obligatoire && (
                  <View style={styles.obligatoireBadge}>
                    <Text style={styles.obligatoireText}>Obligatoire</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>

          {/* Commentaire */}
          {!disabled && (
            <TextInput
              style={styles.commentaireInput}
              placeholder="Commentaire (optionnel)..."
              placeholderTextColor={LUNA_COLORS.textDisabled}
              value={item.commentaire ?? ''}
              onChangeText={(text) => onChange(item.id, item.checked, text)}
              multiline
            />
          )}
          {disabled && item.commentaire ? (
            <Text style={styles.commentaireReadOnly}>{item.commentaire}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: LUNA_COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LUNA_COLORS.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textPrimary,
  },
  item: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  itemChecked: {
    borderColor: LUNA_COLORS.success,
    backgroundColor: LUNA_COLORS.successLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: LUNA_COLORS.success,
    borderColor: LUNA_COLORS.success,
  },
  itemContent: { flex: 1 },
  itemLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  itemLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    lineHeight: 20,
  },
  itemLabelDone: {
    textDecorationLine: 'line-through',
    color: LUNA_COLORS.textDisabled,
  },
  obligatoireBadge: {
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  obligatoireText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.error,
  },
  commentaireInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textPrimary,
    minHeight: 36,
  },
  commentaireReadOnly: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
