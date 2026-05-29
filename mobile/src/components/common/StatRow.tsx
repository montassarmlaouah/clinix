import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  IconBandage,
  IconCalendar,
  IconCards,
  IconClipboardList,
  IconFileText,
  IconHome,
  IconMedicalCross,
  IconNotes,
  IconPackage,
  IconReportMedical,
  IconTools,
  IconUsers,
  IconAlertTriangle,
  type Icon as TablerIcon,
} from '@tabler/icons-react-native';

import type { KPIStat } from '@/src/types/dashboard.types';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';
import { CHART_COLORS } from '@/src/constants/chartColors';

const ICON_MAP: Record<string, TablerIcon> = {
  patients: IconUsers,
  consultations: IconMedicalCross,
  rendez: IconCalendar,
  alertes: IconAlertTriangle,
  stock: IconPackage,
  ordonnances: IconFileText,
  examens: IconReportMedical,
  equipements: IconTools,
  personnel: IconUsers,
  revenus: IconCards,
  cliniques: IconHome,
  abonnements: IconClipboardList,
  soins: IconBandage,
  presences: IconNotes,
  conges: IconCalendar,
  pannes: IconAlertTriangle,
};

function resolveIcon(icon: string): TablerIcon {
  const lower = icon.toLowerCase();
  const key = Object.keys(ICON_MAP).find((k) => lower.includes(k));
  return key ? ICON_MAP[key] : IconMedicalCross;
}

interface StatRowProps {
  stats: KPIStat[];
}

export const StatRow = React.memo(function StatRow({ stats }: StatRowProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }}
    >
      {stats.map((stat, idx) => {
        const color = stat.color ?? CHART_COLORS.primary;
        const hasTrend = stat.trend !== undefined && stat.trend !== null;
        const trendUp = (stat.trend ?? 0) >= 0;
        const Icon = resolveIcon(stat.icon);

        return (
          <View
            key={idx}
            style={{
              width: 140,
              backgroundColor: LUNA_COLORS.surface,
              borderRadius: borderRadius.xl,
              borderTopWidth: 3,
              borderTopColor: color,
              borderWidth: 1,
              borderColor: LUNA_COLORS.borderSubtle,
              padding: spacing.lg,
              ...shadows.card,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.sm,
                backgroundColor: `${color}18`,
              }}
            >
              <Icon size={20} color={color} strokeWidth={1.8} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color, lineHeight: 30 }}>
                {stat.value}
              </Text>
              {hasTrend ? (
                <View
                  style={{
                    borderRadius: borderRadius.full,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    backgroundColor: trendUp ? LUNA_COLORS.successLight : LUNA_COLORS.errorLight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.semibold,
                      color: trendUp ? LUNA_COLORS.success : LUNA_COLORS.danger,
                    }}
                  >
                    {trendUp ? '↑' : '↓'} {Math.abs(stat.trend!)}%
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={{ fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, lineHeight: 16 }} numberOfLines={2}>
              {stat.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
});
