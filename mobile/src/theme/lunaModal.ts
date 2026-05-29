import { Platform, StyleSheet } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ✨ Styles modales HeroUI-inspired avec coins très arrondis, ombres douces multicouches
export const lunaModalStyles = StyleSheet.create({
  // ── Overlay (sombre, dégradé invisible si besoin) ───────────────────────────
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

  // ── Carte modale (coins très arrondis, ombre xl) ────────────────────────────
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.xxl, // ✨ 28px pour HeroUI
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    overflow: 'hidden',
    maxHeight: '90%',
    ...(shadows.xl as object), // ✨ Ombre xl multicouche
  },

  // ── Feuille modale (bottom sheet avec coins top arrondis) ───────────────────
  cardSheet: {
    width: '100%',
    backgroundColor: LUNA_COLORS.surface,
    borderTopLeftRadius: borderRadius.xxl,  // ✨ 28px
    borderTopRightRadius: borderRadius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: LUNA_COLORS.borderSubtle,
    maxHeight: '92%',
    ...(shadows.lg as object),
  },

  // ── En-tête modal (fond primary, texte blanc, icône tertiary) ───────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: LUNA_COLORS.primary, // ✨ #26658c
    borderBottomWidth: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  headerIcon: {
    color: LUNA_COLORS.tertiary, // ✨ #4ecdc4
    fontSize: fontSize.lg,
  },

  // ── Corps modal (padding généreux, scrollable) ────────────────────────────
  body: {
    padding: spacing.xl,
    maxHeight: 420,
    backgroundColor: LUNA_COLORS.surface,
  },

  // ── Pied modal (fond surfaceLight, séparateur subtil) ──────────────────────
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨ Séparateur subtle
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  footerSingle: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)',
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems: 'center',
  },

  // ── Bouton Ghost (bordure, transparent) ────────────────────────────────────
  btnGhost: {
    flex: 1,
    paddingVertical: spacing.md,
    minHeight: 48, // ✨ HeroUI 48px
    borderRadius: borderRadius.full, // ✨ Coins full
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.secondary, // ✨ #2d9cdb
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.secondary,
  },

  // ── Bouton Primary (fond secondary avec ombre colorée) ───────────────────────
  btnPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.secondary, // ✨ #2d9cdb
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.button as object), // ✨ Ombre colorée (shadowColor: #2d9cdb)
  },
  btnPrimaryTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },

  // ── Bouton Danger ────────────────────────────────────────────────────────────
  btnDanger: {
    flex: 1,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.danger, // ✨ #dc2626
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.button as object),
  },
  btnDangerTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },

  // ── Bouton Close-Only (full-width modal unique) ──────────────────────────────
  btnCloseOnly: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.secondary,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.button as object),
  },
  btnCloseOnlyTxt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },

  // ── Details & Champs ──────────────────────────────────────────────────────────
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

  // ── Input modal (HeroUI-style) ──────────────────────────────────────────────
  input: {
    backgroundColor: LUNA_COLORS.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52, // ✨ HeroUI 52px
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
  },

  // ── Boîte d'erreur ──────────────────────────────────────────────────────────
  errBox: {
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.danger,
  },
  errTxt: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.danger,
  },
});
