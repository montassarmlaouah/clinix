import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { apiGet, apiPost } from '@/src/api/client';
import { AUTH_ENDPOINTS } from '@/src/api/endpoints';
import { Button } from '@/src/components/common/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { usePageHeader } from '@/src/hooks/usePageHeader';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

const NOTIF_PREF_KEY = 'profil-notifications-enabled';

export interface UserProfileDto {
  id?: string | number | null;
  nom?: string | null;
  prenom?: string | null;
  telephone?: string | null;
  email?: string | null;
  cin?: string | null;
  role?: string | null;
  cliniqueId?: string | number | null;
  cliniqueNom?: string | null;
  specialite?: string | null;
  numeroPatient?: string | null;
  profilModifiable?: boolean;
}

interface ProfilCommunProps {
  roleLabel: string;
  children?: React.ReactNode;
}

function displayValue(v: string | null | undefined): string {
  const s = v?.trim();
  return s ? s : '—';
}

export function ProfilCommun({ roleLabel, children }: ProfilCommunProps): React.JSX.Element {
  usePageHeader({ title: 'Paramètre', showNotifications: true });

  const { logout } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [ancienPwd, setAncienPwd] = useState('');
  const [nouveauPwd, setNouveauPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiGet<UserProfileDto>(AUTH_ENDPOINTS.PROFILE);
      setProfile(data);
      setAuth({
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        cliniqueId: data.cliniqueId ?? null,
        cliniqueNom: data.cliniqueNom ?? null,
      });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Impossible de charger le profil.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void AsyncStorage.getItem(NOTIF_PREF_KEY).then((v) => {
      if (v != null) setNotifEnabled(v === 'true');
    });
  }, []);

  async function onNotifToggle(value: boolean) {
    setNotifEnabled(value);
    await AsyncStorage.setItem(NOTIF_PREF_KEY, value ? 'true' : 'false');
  }

  async function submitPasswordChange() {
    if (!ancienPwd || !nouveauPwd || !confirmPwd) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (nouveauPwd !== confirmPwd) {
      Alert.alert('Erreur', 'La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await apiPost<{ message?: string }>(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        ancienMotDePasse: ancienPwd,
        nouveauMotDePasse: nouveauPwd,
        confirmationMotDePasse: confirmPwd,
      });
      Alert.alert('Succès', res.message ?? 'Mot de passe modifié.');
      setAncienPwd('');
      setNouveauPwd('');
      setConfirmPwd('');
      setPwdOpen(false);
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as { message?: string })?.message ?? 'Échec du changement de mot de passe.');
    } finally {
      setPwdSaving(false);
    }
  }

  const modifiable = profile?.profilModifiable !== false;
  const fullName = [profile?.prenom, profile?.nom].filter(Boolean).join(' ') || '—';
  const initials = `${(profile?.prenom ?? '?').charAt(0)}${(profile?.nom ?? '?').charAt(0)}`.toUpperCase();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
          <Text style={styles.loaderText}>Chargement du profil…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button title="Réessayer" onPress={() => void loadProfile()} style={{ marginTop: spacing.md }} />
        </View>
      ) : (
        <View style={styles.mainCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <Text style={styles.fullName}>{fullName}</Text>
            <Text style={styles.roleSub}>{roleLabel}</Text>
          </View>

          <View style={styles.divider} />

          <ProfileInfoRow icon="person-outline" label="Prénom" value={displayValue(profile?.prenom)} />
          <ProfileInfoRow icon="person-outline" label="Nom" value={displayValue(profile?.nom)} />
          <ProfileInfoRow icon="mail-outline" label="E-mail" value={displayValue(profile?.email)} />
          <ProfileInfoRow icon="call-outline" label="Téléphone" value={displayValue(profile?.telephone)} />
          {profile?.cliniqueId != null || profile?.cliniqueNom ? (
            <ProfileInfoRow
              icon="business-outline"
              label="Clinique"
              value={displayValue(profile?.cliniqueNom ?? String(profile?.cliniqueId ?? ''))}
            />
          ) : null}
          {profile?.specialite ? (
            <ProfileInfoRow icon="medkit-outline" label="Spécialité" value={displayValue(profile.specialite)} />
          ) : null}
          {profile?.cin ? (
            <ProfileInfoRow icon="card-outline" label="CIN" value={displayValue(profile.cin)} />
          ) : null}
          {profile?.numeroPatient ? (
            <ProfileInfoRow icon="barcode-outline" label="N° patient" value={displayValue(profile.numeroPatient)} />
          ) : null}

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleIcon}>
              <Ionicons name="notifications-outline" size={22} color={LUNA_COLORS.secondary} />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Notifications</Text>
              <Text style={styles.toggleSub}>Recevoir des notifications</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={(v) => void onNotifToggle(v)}
              trackColor={{ false: LUNA_COLORS.borderDark, true: LUNA_COLORS.secondary }}
              thumbColor={LUNA_COLORS.surface}
            />
          </View>

          {modifiable ? (
            <>
              <View style={styles.divider} />
              <Pressable style={styles.accordionHeader} onPress={() => setPwdOpen((o) => !o)}>
                <View style={styles.toggleIcon}>
                  <Ionicons name="lock-closed-outline" size={22} color={LUNA_COLORS.secondary} />
                </View>
                <Text style={styles.accordionTitle}>Changer le mot de passe</Text>
                <Ionicons
                  name={pwdOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={LUNA_COLORS.textDisabled}
                />
              </Pressable>

              {pwdOpen ? (
                <View style={styles.pwdSection}>
                  <PasswordField
                    placeholder="Ancien mot de passe"
                    value={ancienPwd}
                    onChangeText={setAncienPwd}
                    secure={!showAncien}
                    onToggle={() => setShowAncien((s) => !s)}
                  />
                  <PasswordField
                    placeholder="Nouveau mot de passe"
                    value={nouveauPwd}
                    onChangeText={setNouveauPwd}
                    secure={!showNouveau}
                    onToggle={() => setShowNouveau((s) => !s)}
                  />
                  <PasswordField
                    placeholder="Confirmer le nouveau mot de passe"
                    value={confirmPwd}
                    onChangeText={setConfirmPwd}
                    secure={!showConfirm}
                    onToggle={() => setShowConfirm((s) => !s)}
                  />
                  <Button
                    title="Confirmer"
                    onPress={() => void submitPasswordChange()}
                    loading={pwdSaving}
                    fullWidth
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {children ? (
            <>
              <View style={styles.divider} />
              {children}
            </>
          ) : null}

          <View style={styles.divider} />

          <Pressable style={styles.logoutRow} onPress={() => void logout()}>
            <Ionicons name="log-out-outline" size={22} color={LUNA_COLORS.error} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={LUNA_COLORS.secondary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function PasswordField({
  placeholder,
  value,
  onChangeText,
  secure,
  onToggle,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secure: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.pwdField}>
      <TextInput
        style={styles.pwdInput}
        placeholder={placeholder}
        placeholderTextColor={LUNA_COLORS.textDisabled}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable onPress={onToggle} style={styles.eyeBtn} hitSlop={8}>
        <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={LUNA_COLORS.textDisabled} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: LUNA_COLORS.background },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  loaderWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loaderText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  errorBox: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...(shadows.sm as object),
  },
  errorText: { color: LUNA_COLORS.error, fontSize: fontSize.sm },
  mainCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...(shadows.md as object),
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
  },
  avatarTxt: { fontSize: 28, fontWeight: fontWeight.bold, color: LUNA_COLORS.dark },
  fullName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: LUNA_COLORS.darkest,
    marginTop: spacing.sm,
  },
  roleSub: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  divider: {
    height: 1,
    backgroundColor: LUNA_COLORS.borderDark,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: LUNA_COLORS.darkest,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleIcon: {
    width: 40,
    alignItems: 'center',
  },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: LUNA_COLORS.darkest },
  toggleSub: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginTop: 2 },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  accordionTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.darkest,
  },
  pwdSection: { paddingTop: spacing.sm, gap: spacing.sm },
  pwdField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderDark,
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.surface,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  pwdInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: LUNA_COLORS.textPrimary,
    paddingVertical: spacing.sm,
  },
  eyeBtn: { padding: spacing.xs },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: LUNA_COLORS.error,
  },
});
