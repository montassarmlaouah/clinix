// src/components/common/ProfilCommun.tsx
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
import { LunaHeroHeader, LunaScreen } from '@/src/components/common';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

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
  // Informations supplémentaires possibles
  abonnement?: {
    offreNom?: string;
    dateFin?: string;
    statut?: string;
  };
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

  if (loading) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Profil" subtitle={roleLabel} showBack={false} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={LUNA_COLORS.secondary} />
          <Text style={styles.loaderText}>Chargement du profil…</Text>
        </View>
      </LunaScreen>
    );
  }

  if (loadError) {
    return (
      <LunaScreen edges={[]}>
        <LunaHeroHeader title="Profil" subtitle={roleLabel} showBack={false} />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button title="Réessayer" onPress={() => void loadProfile()} style={{ marginTop: spacing.md }} />
        </View>
      </LunaScreen>
    );
  }

  return (
    <LunaScreen edges={[]}>
      <LunaHeroHeader title="Profil" subtitle={roleLabel} showBack={false} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          {/* Avatar + identité */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <Text style={styles.fullName}>{fullName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Informations personnelles */}
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

          {/* Abonnement si disponible */}
          {profile?.abonnement && (
            <>
              <View style={styles.divider} />
              <View style={styles.abonnementCard}>
                <View style={styles.abonnementHeader}>
                  <Ionicons name="crown-outline" size={18} color={LUNA_COLORS.warning} />
                  <Text style={styles.abonnementTitle}>Abonnement actuel</Text>
                </View>
                <Text style={styles.abonnementOffre}>{profile.abonnement.offreNom ?? '—'}</Text>
                {profile.abonnement.dateFin && (
                  <Text style={styles.abonnementDate}>
                    Valable jusqu’au {new Date(profile.abonnement.dateFin).toLocaleDateString()}
                  </Text>
                )}
                {profile.abonnement.statut && (
                  <View style={[styles.statutPill, { backgroundColor: LUNA_COLORS.successLight }]}>
                    <Text style={[styles.statutPillText, { color: LUNA_COLORS.success }]}>
                      {profile.abonnement.statut}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Notifications */}
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
              onValueChange={onNotifToggle}
              trackColor={{ false: LUNA_COLORS.border, true: LUNA_COLORS.secondary }}
              thumbColor={LUNA_COLORS.surface}
            />
          </View>

          {/* Changement mot de passe (si modifiable) */}
          {modifiable && (
            <>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed }) => [styles.accordionHeader, pressed && { opacity: 0.75 }]} // ✨
                onPress={() => setPwdOpen((o) => !o)}
              >
                <View style={styles.toggleIcon}>
                  <Ionicons name="lock-closed-outline" size={22} color={LUNA_COLORS.secondary} />
                </View>
                <Text style={styles.accordionTitle}>Changer le mot de passe</Text>
                <Ionicons name={pwdOpen ? 'chevron-up' : 'chevron-down'} size={20} color={LUNA_COLORS.textDisabled} />
              </Pressable>

              {pwdOpen && (
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
                  <Button title="Confirmer" onPress={submitPasswordChange} loading={pwdSaving} fullWidth />
                </View>
              )}
            </>
          )}

          {children && (
            <>
              <View style={styles.divider} />
              {children}
            </>
          )}

          <View style={styles.divider} />

          {/* Déconnexion */}
          <Pressable
            style={({ pressed }) => [styles.logoutRow, pressed && { opacity: 0.75 }]} // ✨
            onPress={() => void logout()}
          >
            <Ionicons name="log-out-outline" size={22} color={LUNA_COLORS.error} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LunaScreen>
  );
}

// Sous-composants
function ProfileInfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={LUNA_COLORS.secondary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function PasswordField({ placeholder, value, onChangeText, secure, onToggle }: any) {
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
      />
      <Pressable onPress={onToggle} style={styles.eyeBtn} hitSlop={8}>
        <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={LUNA_COLORS.textDisabled} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loaderText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  errorBox: { padding: spacing.lg, alignItems: 'center' },
  errorText: { color: LUNA_COLORS.error, fontSize: fontSize.sm, textAlign: 'center' },

  mainCard: {
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: borderRadius.lg, // ✨ carte lg
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
  },
  avatarSection: { alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LUNA_COLORS.secondary,
  },
  avatarTxt: { fontSize: 32, fontWeight: fontWeight.bold, color: LUNA_COLORS.primary },
  fullName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: LUNA_COLORS.textPrimary },
  roleBadge: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
  },
  roleBadgeText: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary, fontWeight: fontWeight.medium },
  divider: { height: 1, backgroundColor: 'rgba(197, 220, 234, 0.6)', marginVertical: spacing.md }, // ✨

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: LUNA_COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: LUNA_COLORS.textPrimary },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleIcon: { width: 36, alignItems: 'center' },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary },
  toggleSub: { fontSize: fontSize.xs, color: LUNA_COLORS.textSecondary },

  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accordionTitle: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.textPrimary },

  pwdSection: { marginTop: spacing.md, gap: spacing.sm },
  pwdField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LUNA_COLORS.borderInput, // ✨
    borderRadius: borderRadius.md,
    backgroundColor: LUNA_COLORS.inputBg, // ✨
    paddingHorizontal: spacing.md,
  },
  pwdInput: { flex: 1, fontSize: fontSize.base, color: LUNA_COLORS.textPrimary, paddingVertical: spacing.sm },
  eyeBtn: { padding: spacing.xs },

  abonnementCard: {
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderRadius: borderRadius.lg, // ✨
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: LUNA_COLORS.borderSubtle, // ✨
  },
  abonnementHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  abonnementTitle: { ...typography.sectionTitle, marginBottom: 0 }, // ✨
  abonnementOffre: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: LUNA_COLORS.primary },
  abonnementDate: { fontSize: fontSize.sm, color: LUNA_COLORS.textSecondary },
  statutPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  statutPillText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  logoutText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: LUNA_COLORS.error },
});