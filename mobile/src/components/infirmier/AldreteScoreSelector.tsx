import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface AldreteCriteria {
  activite:    0 | 1 | 2;
  respiration: 0 | 1 | 2;
  circulation: 0 | 1 | 2;
  conscience:  0 | 1 | 2;
  spo2:        0 | 1 | 2;
}

const CRITERIA_LABELS: Record<keyof AldreteCriteria, string> = {
  activite:    'Activité musculaire',
  respiration: 'Respiration',
  circulation: 'Circulation / Tension',
  conscience:  'Conscience',
  spo2:        'Saturation O₂',
};

const CRITERIA_HINTS: Record<keyof AldreteCriteria, [string, string, string]> = {
  activite:    ['Aucune',    'Membres distaux', 'Complète'],
  respiration: ['Apnée',     'Limitée',         'Profonde / toux'],
  circulation: ['Δ > 50 mmHg','Δ 20-50 mmHg',  'Δ < 20 mmHg'],
  conscience:  ['Non réveillé','Si stimulé',    'Éveillé'],
  spo2:        ['< 90 %',    'O₂ nécessaire',   '> 92 % air amb.'],
};

const CRITERIA_ORDER: Array<keyof AldreteCriteria> = [
  'activite', 'respiration', 'circulation', 'conscience', 'spo2',
];

interface Props {
  criteria: AldreteCriteria;
  onChange: (scoreTotal: number, criteria: AldreteCriteria) => void;
  disabled?: boolean;
}

function computeScore(c: AldreteCriteria): number {
  return c.activite + c.respiration + c.circulation + c.conscience + c.spo2;
}

export function AldreteScoreSelector({ criteria, onChange, disabled = false }: Props) {
  const score = computeScore(criteria);
  const isTransferable = score >= 9;

  function handleChange(key: keyof AldreteCriteria, val: 0 | 1 | 2) {
    if (disabled) return;
    const next = { ...criteria, [key]: val };
    onChange(computeScore(next), next);
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec score total */}
      <View style={styles.header}>
        <Text style={styles.title}>Score d&apos;Aldrete</Text>
        <View style={[styles.badge, isTransferable ? styles.badgeOk : styles.badgeWarn]}>
          <Ionicons
            name={isTransferable ? 'checkmark-circle' : 'warning'}
            size={14}
            color={isTransferable ? LUNA_COLORS.success : LUNA_COLORS.warning}
          />
          <Text style={[styles.badgeText, isTransferable ? styles.badgeTextOk : styles.badgeTextWarn]}>
            {score}/10 — {isTransferable ? 'Transfert possible' : 'Attendre ≥ 9'}
          </Text>
        </View>
      </View>

      {/* Critères */}
      {CRITERIA_ORDER.map((key) => {
        const hints = CRITERIA_HINTS[key];
        return (
          <View key={key} style={styles.criterion}>
            <Text style={styles.criterionLabel}>{CRITERIA_LABELS[key]}</Text>
            <View style={styles.btnRow}>
              {([0, 1, 2] as const).map((v) => {
                const selected = criteria[key] === v;
                return (
                  <Pressable
                    key={v}
                    style={({ pressed }) => [
                      styles.scoreBtn,
                      selected && styles.scoreBtnSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleChange(key, v)}
                    disabled={disabled}
                  >
                    <Text style={[styles.scoreBtnNum, selected && styles.scoreBtnNumSelected]}>
                      {v}
                    </Text>
                    <Text style={[styles.scoreBtnHint, selected && styles.scoreBtnHintSelected]}
                          numberOfLines={2}>
                      {hints[v]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
  badgeOk:   { backgroundColor: LUNA_COLORS.successLight },
  badgeWarn: { backgroundColor: LUNA_COLORS.warningLight },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  badgeTextOk:   { color: LUNA_COLORS.success },
  badgeTextWarn: { color: LUNA_COLORS.warning },
  criterion: { gap: spacing.xs },
  criterionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textPrimary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scoreBtn: {
    flex: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.inputBg,
    alignItems: 'center',
    padding: spacing.xs,
    gap: 2,
  },
  scoreBtnSelected: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor: LUNA_COLORS.secondary,
  },
  scoreBtnNum: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textPrimary,
  },
  scoreBtnNumSelected: { color: LUNA_COLORS.surface },
  scoreBtnHint: {
    fontSize: 10,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },
  scoreBtnHintSelected: { color: LUNA_COLORS.surface },
});
