import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LoadingOverlay } from '@/src/components/common';
import { apiGet, apiPut } from '@/src/api/client';
import { MEDECINS } from '@/src/api/endpoints';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface MedecinProfile {
  id: string | number;
  nom: string;
  prenom: string;
  specialite?: string;
  numeroOrdre?: string;
  telephone?: string;
  email?: string;
  disponible?: boolean;
}

export default function MedecinProfilScreen(): React.JSX.Element {
  const router = useRouter();
  const { logout } = useAuth();
  const { userId: userIdRaw, nom, prenom } = useAuthStore();
  const userId = String(userIdRaw ?? '');

  const [profile, setProfile] = useState<MedecinProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiGet<MedecinProfile>(MEDECINS.BY_ID(userId));
      setProfile(data);
      setTel(data.telephone ?? '');
      setEmail(data.email ?? '');
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function toggleDisponibilite() {
    if (!userId) return;
    setSaving(true);
    try {
      const updated = await apiPut<MedecinProfile>(MEDECINS.BY_ID(userId), {
        disponible: !profile?.disponible,
      });
      setProfile((p) => (p ? { ...p, disponible: updated.disponible } : p));
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de modifier la disponibilité.');
    } finally {
      setSaving(false);
    }
  }

  async function saveInfos() {
    if (!userId) return;
    setSaving(true);
    try {
      await apiPut(MEDECINS.BY_ID(userId), { telephone: tel, email });
      setProfile((p) => (p ? { ...p, telephone: tel, email } : p));
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de modifier les infos.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay />;

  const fullName = [prenom, nom].filter(Boolean).join(' ') || '—';
  const initials = `${(prenom ?? '?').charAt(0)}${(nom ?? '?').charAt(0)}`.toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & Name */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.role}>Médecin — {profile?.specialite ?? '—'}</Text>
          <Text style={styles.numero}>N° ordre : {profile?.numeroOrdre ?? '—'}</Text>
        </View>

        {/* Disponibilité */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Disponibilité</Text>
            <Pressable onPress={toggleDisponibilite} disabled={saving} style={[styles.toggle, profile?.disponible ? styles.toggleOn : styles.toggleOff]}>
              <View style={[styles.toggleKnob, profile?.disponible ? styles.toggleKnobOn : styles.toggleKnobOff]} />
            </Pressable>
          </View>
          <Text style={styles.toggleLabel}>{profile?.disponible ? 'Disponible' : 'Non disponible'}</Text>
        </View>

        {/* Infos */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            <Pressable onPress={() => setEditing(!editing)}>
              <Ionicons name={editing ? 'checkmark' : 'pencil'} size={18} color={LUNA_COLORS.secondary} />
            </Pressable>
          </View>

          {editing ? (
            <>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput style={styles.input} value={tel} onChangeText={setTel} keyboardType="phone-pad" />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Button title="Enregistrer" onPress={saveInfos} loading={saving} style={{ marginTop: spacing.md }} />
            </>
          ) : (
            <>
              <InfoRow icon="call-outline" label="Téléphone" value={profile?.telephone ?? '—'} />
              <InfoRow icon="mail-outline" label="Email" value={profile?.email ?? '—'} />
            </>
          )}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.actionRow}>
            <Ionicons name="lock-closed-outline" size={18} color={LUNA_COLORS.secondary} />
            <Text style={styles.actionText}>Modifier le mot de passe</Text>
            <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
          </Pressable>
          <Pressable onPress={() => router.push('/(medecin)/change-organisation' as never)} style={styles.actionRow}>
            <Ionicons name="business-outline" size={18} color={LUNA_COLORS.secondary} />
            <Text style={styles.actionText}>Changer d'organisation</Text>
            <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
          </Pressable>
          {useAuthStore.getState().estCabinet && (
            <Pressable onPress={() => router.push('/(medecin)/abonnement' as never)} style={styles.actionRow}>
              <Ionicons name="card-outline" size={18} color={LUNA_COLORS.secondary} />
              <Text style={styles.actionText}>Mon abonnement</Text>
              <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/(medecin)/scanner' as never)} style={styles.actionRow}>
            <Ionicons name="scan-outline" size={18} color={LUNA_COLORS.secondary} />
            <Text style={styles.actionText}>Scanner un patient</Text>
            <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
          </Pressable>
          <Pressable onPress={() => router.push('/(medecin)/transferts/creer' as never)} style={styles.actionRow}>
            <Ionicons name="arrow-redo-outline" size={18} color={LUNA_COLORS.secondary} />
            <Text style={styles.actionText}>Transférer un patient</Text>
            <Ionicons name="chevron-forward" size={18} color={LUNA_COLORS.textDisabled} />
          </Pressable>
        </View>

        <Button title="Se déconnecter" variant="danger" fullWidth onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as never} size={16} color={LUNA_COLORS.secondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LUNA_COLORS.background },
  content: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  avatarWrap: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: LUNA_COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: LUNA_COLORS.textInverse },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  role: { fontSize: fontSize.base, color: LUNA_COLORS.textSecondary },
  numero: { fontSize: fontSize.sm, color: LUNA_COLORS.tertiary },
  card: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...(shadows.sm as object),
  },
  cardTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.darkest },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { width: 50, height: 28, borderRadius: 14, padding: 2 },
  toggleOn: { backgroundColor: LUNA_COLORS.success },
  toggleOff: { backgroundColor: LUNA_COLORS.borderDark },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobOn: { marginLeft: 22 },
  toggleKnobOff: { marginLeft: 0 },
  toggleLabel: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, marginTop: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.dark, marginBottom: spacing.xs },
  input: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  infoLabel: { width: 80, fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  infoValue: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: LUNA_COLORS.darkest, textAlign: 'right' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: LUNA_COLORS.border },
  actionText: { flex: 1, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary },
});
