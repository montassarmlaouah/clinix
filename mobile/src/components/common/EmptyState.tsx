import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { IconFolderOpen, type Icon as TablerIcon } from '@tabler/icons-react-native';

import { Button } from './Button';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, iconSize, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { resolveTablerIcon } from '@/src/utils/iconMapper';

export interface EmptyStateProps {
  icon?: TablerIcon | string;
  title: string;
  subtitle?: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  message,
  action,
}: EmptyStateProps): React.JSX.Element {
  const Icon = typeof icon === 'string' ? resolveTablerIcon(icon) : (icon ?? IconFolderOpen);
  const body = subtitle ?? message;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxxl,
        paddingVertical: spacing.huge,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: borderRadius.full,
          backgroundColor: LUNA_COLORS.surfaceLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
          borderWidth: 1,
          borderColor: LUNA_COLORS.borderSubtle,
        }}
      >
        <Icon size={iconSize.xl} color={LUNA_COLORS.secondary} strokeWidth={1.5} />
      </View>

      <Text
        style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.semibold,
          color: LUNA_COLORS.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>

      {body ? (
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.regular,
            color: LUNA_COLORS.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: spacing.md,
          }}
        >
          {body}
        </Text>
      ) : null}

      {action ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title={action.label} onPress={action.onPress} variant="solid" size="md" />
        </View>
      ) : null}
    </View>
  );
});
