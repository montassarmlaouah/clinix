import { Platform, StyleSheet } from 'react-native';

import { LUNA_COLORS } from './colors';
import { borderRadius, shadows, spacing } from './spacing';
import { fontSize, fontWeight, typography } from './typography';

export const screenStyles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  scrollContentWide: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    paddingBottom: 80,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    ...(shadows.sm as object),
  },
  cardAccent: {
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.secondary,
  },
  tile: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
    borderLeftWidth: 4,
    borderLeftColor: LUNA_COLORS.secondary,
    ...(shadows.sm as object),
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
  inputFocused: {
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
    shadowColor: LUNA_COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: LUNA_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 220, 234, 0.6)',
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: LUNA_COLORS.background,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: LUNA_COLORS.secondary,
    borderColor: LUNA_COLORS.secondary,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterChipTextActive: {
    color: LUNA_COLORS.textInverse,
    fontWeight: fontWeight.bold,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(197, 220, 234, 0.6)',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: LUNA_COLORS.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl + 16,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: LUNA_COLORS.secondary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
        }
      : { elevation: 6 }),
  },
});
