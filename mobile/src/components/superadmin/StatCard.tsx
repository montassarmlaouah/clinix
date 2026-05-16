import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LUNA_COLORS } from '@/src/theme/colors';

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
  container: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: LUNA_COLORS.darkest,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: LUNA_COLORS.darkest,
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