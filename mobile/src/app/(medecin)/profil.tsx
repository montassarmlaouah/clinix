import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilCommun } from '@/src/components/common/ProfilCommun';
import { apiGet, apiPut } from '@/src/api/client';
import { MEDECINS } from '@/src/api/endpoints';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing, shadows } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface MedecinProfile {
  disponible?: boolean;
  specialite?: string;
  numeroOrdre?: string;
}

function MedecinProfilExtras(): React.JSX.Element {
  const router = useRouter();
  const userId = String(useAuthStore((s) => s.userId ?? ''));
  const estCabinet = useAuthStore((s) => s.estCabinet);

  const [profile, setProfile] = useState<MedecinProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet<MedecinProfile>(MEDECINS.BY_ID(userId));
      setProfile(data);
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleDisponibilite() {
    if (!userId) return;
    setSaving(true);
    try {
      const updated = await apiPut<MedecinProfile>(MEDECINS.BY_ID(userId), {
        disponible: !profile?.disponible,
      });
      setProfile((p) => (p ? { ...p, disponible: updated.disponible } : p));
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Impossible de modifier la disponibilité.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.extras}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleIcon}>
          <Ionicons name="pulse-outline" size={22} color={LUNA_COLORS.secondary} />
        </View>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Disponibilité</Text>
          <Text style={styles.toggleSub}>
            {profile?.disponible ? 'Disponible' : 'Non disponible'}
            {profile?.numeroOrdre ? ` · N° ordre ${profile.numeroOrdre}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => void toggleDisponibilite()}
          disabled={saving}
          style={[styles.toggle, profile?.disponible ? styles.toggleOn : styles.toggleOff]}
        >
          <View style={[styles.toggleKnob, profile?.disponible ? styles.toggleKnobOn : styles.toggleKnobOff]} />
        </Pressable>
      </View>

      <ActionLink icon="business-outline" label="Changer d'organisation" onPress={() => router.push('/(medecin)/change-organisation' as never)} />
      {estCabinet ? (
        <ActionLink icon="card-outline" label="Mon abonnement" onPress={() => router.push('/(medecin)/abonnement' as never)} />
      ) : null}
      <ActionLink icon="scan-outline" label="Scanner un patient" onPress={() => router.push('/(medecin)/scanner' as never)} />
      <ActionLink icon="arrow-redo-outline" label="Transférer un patient" onPress={() => router.push('/(medecin)/transferts/creer' as never)} />
    </View>
  );
}

function ActionLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={LUNA_COLORS.secondary} />
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
    </Pressable>
  );
}

export default function MedecinProfilScreen(): React.JSX.Element {
  return (
    <ProfilCommun roleLabel="Médecin">
      <MedecinProfilExtras />
    </ProfilCommun>
  );
}

const styles = StyleSheet.create({
  extras: { gap: spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleIcon: { width: 40, alignItems: 'center' },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  toggleSub: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, padding: 2 },
  toggleOn: { backgroundColor: LUNA_COLORS.success },
  toggleOff: { backgroundColor: LUNA_COLORS.borderDark },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobOn: { marginLeft: 22 },
  toggleKnobOff: { marginLeft: 0 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 220, 234, 0.6)', // ✨
  },
  actionText: { flex: 1, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
});
