import { Platform, StyleSheet } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

/** Modales LUNA — style HeroUI v3 : overlay profond, carte arrondie, en-tête primary. */
export const lunaModalStyles = StyleSheet.create({
  overlayCenter: {
    flex: 1,
    backgroundColor: LUNA_COLORS.overlay, // ✨ overlay plus profond
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
    borderRadius: 20, // ✨ coins très arrondis HeroUI
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    overflow: 'hidden',
    maxHeight: '90%',
    ...(shadows.xl as object),
  },
  cardSheet: {
    width: '100%',
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: LUNA_COLORS.borderSubtle,
    maxHeight: '92%',
    ...(shadows.lg as object),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: LUNA_COLORS.primary, // ✨ en-tête primary, texte blanc
    borderBottomWidth: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse, // ✨ texte blanc sur primary
  },
  headerIcon: {
    color: LUNA_COLORS.tertiary, // ✨ icône accent
  },
  body: {
    padding: spacing.xl, // ✨ padding généreux 20px
    maxHeight: 420,
    backgroundColor: LUNA_COLORS.surface,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨ séparateur subtil
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  footerSingle: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)',
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems: 'center',
  },
  btnGhost: {
    flex: 1,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.full, // ✨ boutons pill
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.secondary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#2d9cdb',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
        }
      : { elevation: 4 }),
  },
  btnPrimaryTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  btnCloseOnly: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.secondary,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#2d9cdb',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
        }
      : { elevation: 4 }),
  },
  btnCloseOnlyTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  btnDanger: {
    flex: 1,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#dc2626',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.30,
          shadowRadius: 12,
        }
      : { elevation: 4 }),
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  detailValue: {
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
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
