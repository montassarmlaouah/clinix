import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface StatCardProps {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  circleColor: string;
  iconColor: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  circleColor,
  iconColor,
  trend,
  trendValue,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.circle, { backgroundColor: circleColor }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend === 'up' ? 'arrow-up' : 'arrow-down'} 
              size={12} 
              color={trend === 'up' ? LUNA_COLORS.success : LUNA_COLORS.error} 
            />
            <Text style={[
              styles.trendText, 
              { color: trend === 'up' ? LUNA_COLORS.success : LUNA_COLORS.error }
            ]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ✨ Carte KPI HeroUI — borderSubtle + shadow sm
  container: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.xs,
  },
  value: {
    ...typography.statValue,
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    color: LUNA_COLORS.textSecondary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  }
});
