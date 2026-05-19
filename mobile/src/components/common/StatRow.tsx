import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { KPIStat } from '@/src/types/dashboard.types';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { CHART_COLORS } from '@/src/constants/chartColors';

// Icônes de secours selon le texte du label
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  patients:       'people-outline',
  consultations:  'medical-outline',
  rendez:         'calendar-outline',
  alertes:        'alert-circle-outline',
  stock:          'cube-outline',
  ordonnances:    'document-text-outline',
  examens:        'scan-outline',
  equipements:    'construct-outline',
  personnel:      'id-card-outline',
  revenus:        'cash-outline',
  cliniques:      'business-outline',
  abonnements:    'card-outline',
  soins:          'bandage-outline',
  presences:      'checkmark-circle-outline',
  conges:         'airplane-outline',
  pannes:         'warning-outline',
};

function resolveIcon(icon: string): keyof typeof Ionicons.glyphMap {
  const lower = icon.toLowerCase();
  const key = Object.keys(ICON_MAP).find((k) => lower.includes(k));
  return key ? ICON_MAP[key] : (icon as keyof typeof Ionicons.glyphMap);
}

interface StatRowProps {
  stats: KPIStat[];
}

export function StatRow({ stats }: StatRowProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {stats.map((stat, idx) => {
        const color = stat.color ?? CHART_COLORS.primary;
        const hasTrend = stat.trend !== undefined && stat.trend !== null;
        const trendUp  = (stat.trend ?? 0) >= 0;

        return (
          <View key={idx} style={[styles.card, { borderTopColor: color }]}>
            {/* Icône */}
            <View style={[styles.iconBg, { backgroundColor: `${color}18` }]}>
              <Ionicons name={resolveIcon(stat.icon)} size={20} color={color} />
            </View>

            {/* Valeur + tendance */}
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color }]}>{stat.value}</Text>
              {hasTrend ? (
                <View style={[styles.trendPill, { backgroundColor: trendUp ? LUNA_COLORS.successLight : LUNA_COLORS.errorLight }]}>
                  <Text style={[styles.trendText, { color: trendUp ? LUNA_COLORS.success : LUNA_COLORS.error }]}>
                    {trendUp ? '↑' : '↓'} {Math.abs(stat.trend!)}%
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.label} numberOfLines={2}>{stat.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.sm,
    gap:               spacing.md,
  },
  card: {
    width:           140,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.xl,
    borderTopWidth:  3,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
    padding:         spacing.lg,
    ...(shadows.card as object),
  },
  iconBg: {
    width:          40,
    height:         40,
    borderRadius:   borderRadius.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
    marginBottom:  4,
    flexWrap:      'wrap',
  },
  value: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: 30,
  },
  trendPill: {
    borderRadius:      borderRadius.full,
    paddingVertical:   2,
    paddingHorizontal: 6,
  },
  trendText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontSize:  fontSize.sm,
    color:     LUNA_COLORS.textSecondary,
    lineHeight: 16,
  },
});
