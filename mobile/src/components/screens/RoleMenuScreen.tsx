import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/common';
import { getRoleMenu } from '@/src/constants/roleMenus';
import { roleLabels } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

export function RoleMenuScreen(): React.JSX.Element {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const prenom = useAuthStore((s) => s.prenom);
  const nom = useAuthStore((s) => s.nom);
  const items = getRoleMenu(role);
  const roleLabel = role ? (roleLabels[role] ?? role) : 'Utilisateur';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu CLINIX</Text>
        <Text style={styles.subtitle}>
          {prenom} {nom} · {roleLabel}
        </Text>
        <Text style={styles.hint}>Toutes les fonctions du portail web</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {items.length === 0 ? (
          <EmptyState icon="apps-outline" title="Menu indisponible" subtitle="Rôle non reconnu." />
        ) : null}
        {items.map((item) => (
          <Pressable
            key={item.route}
            style={styles.tile}
            onPress={() => router.push(item.route as never)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={26} color={LUNA_COLORS.secondary} />
            </View>
            <Text style={styles.tileLabel}>{item.label}</Text>
            {item.description ? (
              <Text style={styles.tileDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <Ionicons
              name="chevron-forward"
              size={16}
              color={LUNA_COLORS.textDisabled}
              style={styles.chevron}
            />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LUNA_COLORS.background,
  },
  header: {
    padding: spacing.xxl,
    backgroundColor: LUNA_COLORS.dark,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.textInverse,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: LUNA_COLORS.primary,
    marginTop: 4,
  },
  hint: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    marginTop: spacing.sm,
  },
  grid: {
    padding: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: 100,
  },
  tile: {
    width: '47%',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 120,
    ...(shadows.sm as object),
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest,
  },
  tileDesc: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
});
