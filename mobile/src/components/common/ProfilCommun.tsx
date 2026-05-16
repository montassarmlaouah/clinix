import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { LunaHeroHeader } from '@/src/components/common/LunaHeroHeader';
import { LunaScreen } from '@/src/components/common/LunaScreen';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface ProfilCommunProps {
  roleLabel: string;
}

export function ProfilCommun({ roleLabel }: ProfilCommunProps): React.JSX.Element {
  const router = useRouter();
  const { nom, prenom, userId, cliniqueId, email, telephone } = useAuthStore();
  const { logout } = useAuth();

  const fullName = [prenom, nom].filter(Boolean).join(' ') || '—';
  const initials = `${(prenom ?? '?').charAt(0)}${(nom ?? '?').charAt(0)}`.toUpperCase();

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Mon profil" subtitle={roleLabel} showNotifications />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <InfoRow icon="id-card-outline" label="Identifiant" value={String(userId ?? '—')} />
          {cliniqueId != null ? (
            <InfoRow icon="business-outline" label="Clinique" value={String(cliniqueId)} />
          ) : null}
        </View>

        <Pressable
          style={styles.menuRow}
          onPress={() => router.push('/notifications' as never)}
        >
          <Ionicons name="notifications-outline" size={22} color={LUNA_COLORS.secondary} />
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
        </Pressable>

        <Button title="Se déconnecter" variant="danger" fullWidth onPress={logout} />
      </ScrollView>
    </LunaScreen>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon as never} size={18} color={LUNA_COLORS.secondary} />
      </View>
      <View style={infoStyles.text}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 100, gap: spacing.lg },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    ...(shadows.md as object),
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: LUNA_COLORS.primary,
  },
  avatarTxt: { fontSize: 32, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginTop: spacing.md,
  },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: LUNA_COLORS.secondaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...(shadows.sm as object),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...(shadows.sm as object),
  },
  menuLabel: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  value: { fontSize: fontSize.md, color: LUNA_COLORS.darkest, fontWeight: fontWeight.medium, marginTop: 2 },
});
