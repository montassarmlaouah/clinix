import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface ChartCardProps {
  title:     string;
  subtitle?: string;
  badge?:    string;
  children:  React.ReactNode;
  style?:    ViewStyle;
}

export function ChartCard({
  title,
  subtitle,
  badge,
  children,
  style,
}: ChartCardProps): React.JSX.Element {
  return (
    <View style={[styles.card, style]}>
      {/* Header avec dégradé subtil */}
      <LinearGradient
        colors={['rgba(45,156,219,0.06)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      {/* Contenu chart */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius:    borderRadius.xl,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
    marginBottom:    spacing.lg,
    overflow:        'hidden',
    ...(shadows.card as object),
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.lg,
    paddingBottom:     spacing.sm,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textPrimary,
  },
  subtitle: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor:   LUNA_COLORS.secondaryLight,
    borderRadius:      borderRadius.full,
    paddingVertical:   3,
    paddingHorizontal: spacing.sm,
    marginLeft:        spacing.sm,
    borderWidth:       1,
    borderColor:       LUNA_COLORS.borderSubtle,
  },
  badgeText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.secondary,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom:     spacing.lg,
    paddingTop:        spacing.sm,
  },
});
