import { StyleSheet } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Styles tableau admin (en-tête teal, lignes alternées, actions web). */
export const adminTableStyles = StyleSheet.create({
  tableWrap: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: LUNA_COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: LUNA_COLORS.secondary,
  },
  thText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: LUNA_COLORS.borderDark,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  chambreNum: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
  },
  chambreId: {
    fontSize: 9,
    color: LUNA_COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
    backgroundColor: LUNA_COLORS.surfaceLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cellText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.dark,
    fontWeight: fontWeight.medium,
  },
  cellMuted: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    alignSelf: 'flex-start',
  },
  typeBadgeTxt: {
    fontSize: 10,
    color: LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.medium,
  },
  capBar: {
    height: 5,
    backgroundColor: LUNA_COLORS.borderDark,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  capFill: {
    height: '100%',
    backgroundColor: LUNA_COLORS.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusTxt: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  emptyRow: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: LUNA_COLORS.textSecondary,
    fontSize: fontSize.sm,
  },
});
