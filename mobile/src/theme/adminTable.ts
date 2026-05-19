import { Platform, StyleSheet } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Styles tableau admin — HeroUI : en-tête primary, lignes alternées, actions rondes. */
export const adminTableStyles = StyleSheet.create({
  tableWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg, // ✨ coins arrondis 16px
    overflow: 'hidden',
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.primary, // ✨ en-tête primary, texte blanc
    borderBottomWidth: 0,
  },
  thText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.5)', // ✨ séparateur subtil
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: LUNA_COLORS.surfaceLight, // ✨ lignes alternées
  },
  tableRowPressed: {
    backgroundColor: LUNA_COLORS.surfaceActive, // ✨ état press/hover
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full, // ✨ boutons icônes ronds
    backgroundColor: 'rgba(45, 156, 219, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chambreNum: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
  },
  chambreId: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
    backgroundColor: LUNA_COLORS.surfaceLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  cellText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.medium,
  },
  cellMuted: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignSelf: 'flex-start',
  },
  typeBadgeTxt: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  capBar: {
    height: 5,
    backgroundColor: LUNA_COLORS.border,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: 3,
  },
  capFill: {
    height: '100%',
    backgroundColor: LUNA_COLORS.secondary,
    borderRadius: borderRadius.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4, // ✨ point coloré devant le statut
  },
  statusTxt: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyRow: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: LUNA_COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
});
