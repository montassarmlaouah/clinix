import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export const TTL_OPTIONS = [
  { label: '1h',  value: 60 },
  { label: '2h',  value: 120 },
  { label: '4h',  value: 240 },
  { label: '24h', value: 1440 },
] as const;

interface TTLSelectorProps {
  value:    number;
  onChange: (minutes: number) => void;
}

export function TTLSelector({ value, onChange }: TTLSelectorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Délai de réponse</Text>
      <View style={styles.row}>
        {TTL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.btn, value === opt.value && styles.btnActive]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === opt.value }}
          >
            <Text style={[styles.btnText, value === opt.value && styles.btnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap:           spacing.sm,
  },
  btn: {
    flex:            1,
    paddingVertical: spacing.sm,
    alignItems:      'center',
    borderRadius:    borderRadius.sm,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.tertiary,
    backgroundColor: LUNA_COLORS.surface,
  },
  btnActive: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor:     LUNA_COLORS.secondary,
  },
  btnText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textPrimary,
  },
  btnTextActive: {
    color: LUNA_COLORS.textInverse,
  },
});
