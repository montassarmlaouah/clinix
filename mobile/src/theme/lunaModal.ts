import { StyleSheet } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Styles modales LUNA (centrées, pied compact — pas de bouton géant). */
export const lunaModalStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  overlaySheet: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  cardSheet: {
    width: '100%',
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.dark,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  body: {
    padding: spacing.lg,
    maxHeight: 420,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.borderDark,
  },
  footerSingle: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: LUNA_COLORS.borderDark,
    alignItems: 'center',
  },
  btnGhost: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    alignItems: 'center',
  },
  btnGhostTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
  },
  btnPrimaryTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  btnCloseOnly: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.tertiary,
    minWidth: 120,
    maxWidth: 200,
    alignItems: 'center',
  },
  btnCloseOnlyTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textInverse,
  },
  btnDanger: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.error,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textSecondary,
    marginTop: spacing.sm,
  },
  detailValue: {
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.dark,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: LUNA_COLORS.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },
  errBox: {
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errTxt: { fontSize: fontSize.sm, color: LUNA_COLORS.error },
});
