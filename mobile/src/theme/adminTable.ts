import { Platform, StyleSheet } from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ✨ Styles tableaux HeroUI v3 — en-têtes dégradés, lignes alternées, ombres subtiles
export const adminTableStyles = StyleSheet.create({
  // ── Wrapper tableau (cardé avec ombre douce) ─────────────────────────────────
  tableWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg, // ✨ 16px arrondi
    overflow: 'hidden',
    backgroundColor: LUNA_COLORS.surface,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.md as object), // ✨ Ombre douce (md)
  },

  // ── En-tête (fond primary sombre, texte blanc uppercase) ────────────────────
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.primary, // ✨ #26658c
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(38, 101, 140, 0.2)',
  },
  thText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse, // ✨ Blanc
    textTransform: 'uppercase',
    letterSpacing: 0.8, // ✨ HeroUI letter-spacing
  },

  // ── Ligne tableau (alternée blanc/gris clair) ────────────────────────────────
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.5)', // ✨ Séparateur subtle
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: LUNA_COLORS.surfaceLight, // ✨ Ligne paire gris clair
  },
  tableRowPressed: {
    backgroundColor: LUNA_COLORS.surfaceActive, // ✨ Bleu clair on press
  },

  // ── Actions (boutons icônes ronds semi-transparents) ────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionBtn: {
    width: 36, // ✨ Augmenté à 36px pour meilleure UX
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(45, 156, 219, 0.12)', // ✨ Bleu semi-transparent
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.sm as object),
  },

  // ── Numéro chambre (titre gras) ────────────────────────────────────────────
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

  // ── Texte cellule (standard) ───────────────────────────────────────────────
  cellText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.medium,
  },
  cellMuted: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
  },

  // ── Badge type (fond clair coloré, coins arrondis) ──────────────────────────
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full, // ✨ Coins arrondis
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(45, 156, 219, 0.25)',
  },
  typeBadgeTxt: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textPrimary,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── Barre capacité (colorée selon statut) ──────────────────────────────────
  capBar: {
    height: 6, // ✨ Augmenté à 6px
    backgroundColor: 'rgba(197, 220, 234, 0.4)',
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  capBarFill: {
    height: '100%',
    backgroundColor: LUNA_COLORS.secondary, // ✨ #2d9cdb
    borderRadius: borderRadius.xs,
  },
  capBarSuccess: {
    backgroundColor: LUNA_COLORS.success,
  },
  capBarWarning: {
    backgroundColor: LUNA_COLORS.warning,
  },
  capBarDanger: {
    backgroundColor: LUNA_COLORS.danger,
  },

  // ── Vide (aucun résultat) ──────────────────────────────────────────────────
  emptyRow: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LUNA_COLORS.surfaceLight,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.textSecondary,
  },
});
