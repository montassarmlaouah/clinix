import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { LUNA_COLORS } from '@/src/theme/colors';
import { iconSize, spacing } from '@/src/theme/spacing';
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
          size={iconSize.xxl}
          color={LUNA_COLORS.primary}
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
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical:   spacing.huge,
  },
  iconWrapper: {
    width:           iconSize.xxl + spacing.xxl,
    height:          iconSize.xxl + spacing.xxl,
    borderRadius:    (iconSize.xxl + spacing.xxl) / 2,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.xl,
  },
  title: {
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textPrimary,
    textAlign:  'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.regular,
    color:      LUNA_COLORS.textSecondary,
    textAlign:  'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});

export default EmptyState;
