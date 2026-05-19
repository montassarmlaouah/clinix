import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, iconSize, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon:      keyof typeof Ionicons.glyphMap;
  title:     string;
  subtitle?: string;
  message?:  string;
  action?:   { label: string; onPress: () => void };
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  subtitle,
  message,
  action,
}: EmptyStateProps): React.JSX.Element {
  const body = subtitle ?? message;
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons
          name={icon}
          size={iconSize.xl}
          color={LUNA_COLORS.secondary}
        />
      </View>

      <Text style={styles.title}>{title}</Text>

      {body ? (
        <Text style={styles.subtitle}>{body}</Text>
      ) : null}

      {action ? (
        <View style={styles.actionWrapper}>
          <Button
            title={action.label}
            onPress={action.onPress}
            variant="primary"
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical:   spacing.huge,
  },
  iconWrapper: {
    width:           80,
    height:          80,
    borderRadius:    borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight, // ✨ cercle doux
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.xl,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
  },
  title: {
    fontSize:     fontSize.lg,
    fontWeight:   fontWeight.semibold,
    color:        LUNA_COLORS.textPrimary,
    textAlign:    'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize:     fontSize.sm, // ✨ message centré textSecondary 14px
    fontWeight:   fontWeight.regular,
    color:        LUNA_COLORS.textSecondary,
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: spacing.md,
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});

export default EmptyState;
