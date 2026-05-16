import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const ALDRETE_LABELS: Record<number, string> = {
  0: 'État critique',
  1: 'Très altéré',
  2: 'Fortement altéré',
  3: 'Sévèrement altéré',
  4: 'Très insuffisant',
  5: 'Insuffisant',
  6: 'Partiellement suffisant',
  7: 'Presque suffisant',
  8: 'Quasiment prêt',
  9: 'Prêt pour le transfert',
  10: 'Pleinement rétabli',
};

interface Props {
  value?: number;
  onChange: (score: number) => void;
  disabled?: boolean;
}

export function AldreteScoreSelector({ value, onChange, disabled = false }: Props) {
  const isTransferable = value !== undefined && value >= 9;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Score d'Aldrete</Text>
        {value !== undefined && (
          <View style={[styles.badge, isTransferable ? styles.badgeOk : styles.badgeWarn]}>
            <Ionicons
              name={isTransferable ? 'checkmark-circle' : 'warning'}
              size={14}
              color={isTransferable ? LUNA_COLORS.success : LUNA_COLORS.warning}
            />
            <Text style={[styles.badgeText, isTransferable ? styles.badgeTextOk : styles.badgeTextWarn]}>
              {isTransferable ? 'Transfert possible' : 'Attendre ≥ 9'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 11 }, (_, i) => i).map((score) => {
          const isSelected = value === score;
          const isGreen = score >= 9;
          return (
            <Pressable
              key={score}
              onPress={() => !disabled && onChange(score)}
              style={[
                styles.scoreBtn,
                isSelected && (isGreen ? styles.scoreBtnSelectedGreen : styles.scoreBtnSelected),
                isGreen && !isSelected && styles.scoreBtnGreenIdle,
              ]}
            >
              <Text
                style={[
                  styles.scoreBtnText,
                  isSelected && styles.scoreBtnTextSelected,
                ]}
              >
                {score}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {value !== undefined && (
        <Text style={styles.description}>{ALDRETE_LABELS[value]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeOk: { backgroundColor: LUNA_COLORS.successLight },
  badgeWarn: { backgroundColor: LUNA_COLORS.warningLight },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  badgeTextOk: { color: LUNA_COLORS.success },
  badgeTextWarn: { color: LUNA_COLORS.warning },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  scoreBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LUNA_COLORS.background,
  },
  scoreBtnGreenIdle: { borderColor: LUNA_COLORS.success },
  scoreBtnSelected: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor: LUNA_COLORS.secondary,
  },
  scoreBtnSelectedGreen: {
    backgroundColor: LUNA_COLORS.success,
    borderColor: LUNA_COLORS.success,
  },
  scoreBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textPrimary,
  },
  scoreBtnTextSelected: { color: LUNA_COLORS.surface },
  description: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
