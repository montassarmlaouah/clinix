import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentTabsProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  onDark?: boolean;
}

export function SegmentTabs<T extends string>({
  options,
  value,
  onChange,
  onDark = true,
}: SegmentTabsProps<T>): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: borderRadius.full,
        padding: 4,
        gap: 4,
        backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : LUNA_COLORS.surface,
        ...(onDark ? {} : { borderWidth: 1, borderColor: LUNA_COLORS.borderSubtle }),
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: spacing.sm,
                alignItems: 'center',
                borderRadius: borderRadius.full,
                backgroundColor: active
                  ? LUNA_COLORS.secondary
                  : onDark
                    ? 'transparent'
                    : LUNA_COLORS.background,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                color: active
                  ? LUNA_COLORS.textInverse
                  : onDark
                    ? 'rgba(255,255,255,0.75)'
                    : LUNA_COLORS.textSecondary,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
