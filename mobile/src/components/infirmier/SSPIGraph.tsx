import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface MesurePoint {
  timestamp: string;
  spo2?: number;
  tensionSystolique?: number;
  pouls?: number;
}

interface Props {
  mesures: MesurePoint[];
}

const W = Dimensions.get('window').width - spacing.md * 4;
const H = 120;
const POINT_R = 4;

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function mapValue(val: number, min: number, max: number, height: number): number {
  const clamped = Math.min(max, Math.max(min, val));
  return height - ((clamped - min) / (max - min)) * height;
}

function buildPath(
  points: Array<{ x: number; y: number }>,
): string {
  if (points.length === 0) return '';
  const segments = points.map((p, i) =>
    i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`,
  );
  return segments.join(' ');
}

export function SSPIGraph({ mesures }: Props) {
  if (mesures.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Minimum 2 mesures requises pour afficher le graphique
        </Text>
      </View>
    );
  }

  const n = mesures.length;
  const colW = W / (n - 1);

  const spo2Points = mesures
    .map((m, i) =>
      m.spo2 != null
        ? { x: i * colW, y: mapValue(m.spo2, 80, 100, H) }
        : null,
    )
    .filter(Boolean) as Array<{ x: number; y: number }>;

  const taPoints = mesures
    .map((m, i) =>
      m.tensionSystolique != null
        ? { x: i * colW, y: mapValue(m.tensionSystolique, 60, 200, H) }
        : null,
    )
    .filter(Boolean) as Array<{ x: number; y: number }>;

  const poulsPoints = mesures
    .map((m, i) =>
      m.pouls != null
        ? { x: i * colW, y: mapValue(m.pouls, 40, 160, H) }
        : null,
    )
    .filter(Boolean) as Array<{ x: number; y: number }>;

  const { Svg, Path, Circle } = require('react-native-svg');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Évolution des constantes</Text>

      {/* Légende */}
      <View style={styles.legend}>
        {[
          { color: '#1976D2', label: 'SpO₂ (%)' },
          { color: LUNA_COLORS.error, label: 'TA syst. (mmHg)' },
          { color: LUNA_COLORS.warning, label: 'Pouls (bpm)' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={W} height={H + 20}>
          {/* SpO2 */}
          <Path d={buildPath(spo2Points)} stroke="#1976D2" strokeWidth={2} fill="none" />
          {spo2Points.map((p, i) => (
            <Circle key={`spo2-${i}`} cx={p.x} cy={p.y} r={POINT_R} fill="#1976D2" />
          ))}

          {/* TA systolique */}
          <Path d={buildPath(taPoints)} stroke={LUNA_COLORS.error} strokeWidth={2} fill="none" />
          {taPoints.map((p, i) => (
            <Circle key={`ta-${i}`} cx={p.x} cy={p.y} r={POINT_R} fill={LUNA_COLORS.error} />
          ))}

          {/* Pouls */}
          <Path d={buildPath(poulsPoints)} stroke={LUNA_COLORS.warning} strokeWidth={1.5} strokeDasharray="4 2" fill="none" />
          {poulsPoints.map((p, i) => (
            <Circle key={`pouls-${i}`} cx={p.x} cy={p.y} r={POINT_R - 1} fill={LUNA_COLORS.warning} />
          ))}
        </Svg>
      </ScrollView>

      {/* Axe X — timestamps */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.xAxis, { width: W }]}>
          {mesures.map((m, i) => (
            <Text
              key={i}
              style={[styles.xLabel, { left: i * colW - 20 }]}
            >
              {formatTime(m.timestamp)}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textPrimary,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  empty: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
  },
  xAxis: { height: 24, position: 'relative' },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    color: LUNA_COLORS.textSecondary,
    width: 40,
    textAlign: 'center',
  },
});
