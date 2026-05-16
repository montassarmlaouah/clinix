import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  /** Sur fond sombre (header hero) */
  onDark?: boolean;
}

export function SegmentTabs<T extends string>({
  options,
  value,
  onChange,
  onDark = true,
}: SegmentTabsProps<T>): React.JSX.Element {
  return (
    <View style={[styles.wrap, onDark ? styles.wrapDark : styles.wrapLight]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.tab,
              onDark
                ? active
                  ? styles.tabActiveDark
                  : styles.tabIdleDark
                : active
                  ? styles.tabActiveLight
                  : styles.tabIdleLight,
            ]}
          >
            <Text
              style={[
                styles.label,
                onDark
                  ? active
                    ? styles.labelActiveDark
                    : styles.labelIdleDark
                  : active
                    ? styles.labelActiveLight
                    : styles.labelIdleLight,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
    gap: 4,
  },
  wrapDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  wrapLight: { backgroundColor: LUNA_COLORS.surface },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabActiveDark: { backgroundColor: LUNA_COLORS.secondary },
  tabIdleDark: { backgroundColor: 'transparent' },
  tabActiveLight: { backgroundColor: LUNA_COLORS.secondary },
  tabIdleLight: { backgroundColor: LUNA_COLORS.background },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  labelActiveDark: { color: LUNA_COLORS.textInverse },
  labelIdleDark: { color: 'rgba(255,255,255,0.75)' },
  labelActiveLight: { color: LUNA_COLORS.textInverse },
  labelIdleLight: { color: LUNA_COLORS.textSecondary },
});
