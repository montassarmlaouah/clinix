import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiPost } from '@/src/api/client';
import { AUTH_ENDPOINTS } from '@/src/api/endpoints';
import { Button, Card, Input } from '@/src/components/common';
import { normalizeRole, ROLE_ROUTES } from '@/src/constants/roles';
import { useAuthStore } from '@/src/store/auth.store';
import { LUNA_COLORS } from '@/src/theme/colors';
import { borderRadius, shadows, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

// ── Payload JWT ───────────────────────────────────────────────────────────────
interface JwtPayload {
  sub:        string;
  userId?:    number;
  id?:        number;
  role?:      string;
  nom?:       string;
  prenom?:    string;
  cliniqueId?: string;
  cliniqueNom?: string;
  exp:         number;
}

// ── Type réponse login ────────────────────────────────────────────────────────
interface LoginResponse {
  token:    string;
  role?:    string;
  id?:      number | null;
  message?: string;
  user?: {
    id?:        number | null;
    username?:  string | null;
    role?:      string;
    telephone?: string | null;
    nom?:       string | null;
    prenom?:    string | null;
    cliniqueId?: number | null;
    cliniqueNom?: string | null;
    estCabinet?: boolean;
    accesCabinet?: boolean;
  };
}

export default function LoginScreen(): React.JSX.Element {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [telephone,  setTelephone]  = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Soumission ──────────────────────────────────────────────────────────────
  async function handleLogin(): Promise<void> {
    if (!telephone.trim() || !motDePasse) {
      setError('Veuillez renseigner tous les champs.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // ── Le backend attend username/password (pas telephone/motDePasse) ────
      const data = await apiPost<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
        username: telephone.trim(),
        password: motDePasse,
      });

      // ── Décoder le JWT pour extraire toutes les claims ────────────────────
      let decodedJwt: JwtPayload | null = null;
      if (data.token) {
        try {
          decodedJwt = jwtDecode<JwtPayload>(data.token);
        } catch { /* ignore */ }
      }

      // ── Extraire l'id : racine → user{} → JWT → sub (super admin) ─────────
      let userId: string | number | null =
        data.id ?? data.user?.id ?? decodedJwt?.userId ?? decodedJwt?.id ?? null;
      if (userId == null && decodedJwt?.sub) {
        userId = decodedJwt.sub;
      }

      // ── Extraire le rôle : racine → user{} → JWT ─────────────────────────
      const role = normalizeRole(
        data.role ?? data.user?.role ?? decodedJwt?.role ?? null,
      );

      // ── Extraire nom/prénom depuis user{} ou JWT claims ──────────────────
      const nom        = data.user?.nom ?? data.user?.username ?? decodedJwt?.nom ?? null;
      const prenom     = data.user?.prenom ?? decodedJwt?.prenom ?? null;
      const cliniqueId =
        data.user?.cliniqueId ?? decodedJwt?.cliniqueId ?? null;
      const cliniqueNom =
        data.user?.cliniqueNom ?? decodedJwt?.cliniqueNom ?? null;
      const accesCabinet =
        !!(data.user?.accesCabinet) ||
        !!(decodedJwt?.accesCabinet);
      const estCabinet =
        !!(data.user?.estCabinet) ||
        accesCabinet ||
        (String(role ?? '').includes('MEDECIN') &&
          (cliniqueId == null || cliniqueId === '' || cliniqueId === 'null'));

      // ── Sauvegarde dans le store Zustand (persiste automatiquement) ───────
      setAuth({
        token: data.token,
        role,
        userId,
        cliniqueId,
        cliniqueNom,
        nom,
        prenom,
        estCabinet,
        accesCabinet,
      });

      // ── Mapping rôle → route ────────────────────────────────────
      const roleRoutes: Record<string, string> = {
        ...ROLE_ROUTES,
        'ROLE_SUPER_ADMIN':    '/(superadmin)/dashboard',
        'ROLE_ADMIN_CLINIQUE': '/(admin)/dashboard',
        'ROLE_SECRETAIRE':             '/(secretaire)',
        'ROLE_MEDECIN':                '/(medecin)',
        'ROLE_INFIRMIER':              '/(infirmier)',
        'ROLE_RADIOLOGUE':             '/(radiologue)',
        'ROLE_PHARMACIEN':             '/(pharmacien)/stock',
        'ROLE_PATIENT':                '/(patient)/dossier',
        'ROLE_CHEF_PERSONNEL':         '/(chef-personnel)',
        'ROLE_TECHNICIEN_MAINTENANCE': '/(technicien)/equipements',
        'SUPER_ADMIN':                 '/(superadmin)/dashboard',
        'ADMIN_CLINIQUE':              '/(admin)/dashboard',
        'SECRETAIRE':                  '/(secretaire)',
        'MEDECIN':                     '/(medecin)',
        'INFIRMIER':                   '/(infirmier)',
        'RADIOLOGUE':                  '/(radiologue)',
        'PHARMACIEN':                  '/(pharmacien)/stock',
        'PATIENT':                     '/(patient)/dossier',
        'CHEF_PERSONNEL':              '/(chef-personnel)',
        'TECHNICIEN_MAINTENANCE':      '/(technicien)/equipements',
      };

      // Médecin avec cabinet → même groupe (medecin) avec sélecteur d'organisation
      const dest = role ? roleRoutes[role] : undefined;
      if (dest) {
        router.replace(dest as any);
      } else {
        setError(`Rôle non reconnu : ${role ?? 'null'}`);
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 0) {
        setError('Serveur inaccessible. Vérifiez votre connexion réseau.');
      } else if (status === 401) {
        setError('Identifiants incorrects. Veuillez réessayer.');
      } else if (status === 403) {
        setError('Compte désactivé. Contactez un administrateur.');
      } else {
        const msg = (err as { message?: string })?.message;
        setError(msg ?? 'Erreur de connexion. Vérifiez votre réseau.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Décors de fond ── */}
      <View style={styles.blobTopLeft} pointerEvents="none" />
      <View style={styles.blobTopRight} pointerEvents="none" />
      <View style={styles.blobBottomRight} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── En-tête ── */}
          <View style={styles.header}>
            {/* Badge logo avec ring colorée */}
            <View style={styles.logoRing}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/src/images/logo2.jpeg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Titre de bienvenue */}
            <Text style={styles.welcomeTitle}>Bienvenue sur</Text>
            <Text style={styles.appName}>Clinix</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <Ionicons name="shield-checkmark-outline" size={12} color={LUNA_COLORS.secondary} />
                <Text style={styles.badgeText}>Espace professionnel sécurisé</Text>
              </View>
            </View>
          </View>

          {/* ── Séparateur avec label ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>Connexion</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Formulaire ── */}
          <Card style={styles.formCard}>
            <Input
              label="Identifiant"
              value={telephone}
              onChangeText={setTelephone}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Téléphone ou nom d'utilisateur"
              returnKeyType="next"
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={LUNA_COLORS.textSecondary}
                />
              }
            />

            <Input
              label="Mot de passe"
              value={motDePasse}
              onChangeText={setMotDePasse}
              secureTextEntry
              placeholder="••••••••"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={LUNA_COLORS.textSecondary}
                />
              }
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={LUNA_COLORS.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.submitWrap}>
              <Button
                title="Se connecter"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            {/* ── Lien mot de passe oublié (dans la card) ── */}
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={({ pressed }) => [styles.forgotLink, pressed && styles.forgotLinkPressed]}
              accessibilityRole="button"
              accessibilityLabel="Mot de passe oublié"
            >
              <Ionicons name="key-outline" size={14} color={LUNA_COLORS.secondary} />
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>
          </Card>

          {/* ── Infos rôles ── */}
          <View style={styles.rolesHint}>
            <Ionicons name="information-circle-outline" size={14} color={LUNA_COLORS.textDisabled} />
            <Text style={styles.rolesHintText}>
              Accès réservé au personnel médical et administratif
            </Text>
          </View>

          {/* ── Footer version ── */}
          <Text style={styles.versionText}>v1.0.0 · 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: LUNA_COLORS.background,
  },
  kav: {
    flex: 1,
  },

  // ── Blobs décoratifs de fond ──────────────────────────────────────────────
  blobTopLeft: {
    position:        'absolute',
    top:             -80,
    left:            -80,
    width:           220,
    height:          220,
    borderRadius:    110,
    backgroundColor: 'rgba(38, 101, 140, 0.09)',
  },
  blobTopRight: {
    position:        'absolute',
    top:             -40,
    right:           -60,
    width:           160,
    height:          160,
    borderRadius:    80,
    backgroundColor: 'rgba(45, 156, 219, 0.10)',
  },
  blobBottomRight: {
    position:        'absolute',
    bottom:          60,
    right:           -50,
    width:           130,
    height:          130,
    borderRadius:    65,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: spacing.xxl,
    paddingTop:        spacing.huge,
    paddingBottom:     spacing.xxxl,
  },

  // ── En-tête ───────────────────────────────────────────────────────────────
  header: {
    alignItems:   'center',
    marginBottom: spacing.xxl,
  },
  logoRing: {
    padding:         4,
    borderRadius:    borderRadius.xl + 8,
    borderWidth:     2,
    borderColor:     LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
    marginBottom:    spacing.lg,
    ...(shadows.md as object),
  },
  logoContainer: {
    width:           96,
    height:          96,
    borderRadius:    borderRadius.xl,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  logo: {
    width:  84,
    height: 84,
  },
  welcomeTitle: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      LUNA_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  appName: {
    fontSize:      fontSize.xl,
    fontWeight:    fontWeight.semibold,
    color:         LUNA_COLORS.secondary,
    marginTop:     2,
    marginBottom:  spacing.sm,
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgePill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: LUNA_COLORS.secondaryLight,
    borderRadius:    borderRadius.full,
    paddingVertical:   4,
    paddingHorizontal: spacing.md,
    borderWidth:     1,
    borderColor:     LUNA_COLORS.borderSubtle,
  },
  badgeText: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.medium,
    color:      LUNA_COLORS.secondary,
  },

  // ── Séparateur ────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing.lg,
    gap:           spacing.sm,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: LUNA_COLORS.border,
  },
  dividerLabel: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      LUNA_COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },

  // ── Card formulaire ───────────────────────────────────────────────────────
  formCard: {
    padding:      spacing.xxl,
    borderRadius: borderRadius.xl,
    borderWidth:  1,
    borderColor:  LUNA_COLORS.borderSubtle,
    backgroundColor: LUNA_COLORS.surface,
    ...(shadows.lg as object),
  },
  errorBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.xs,
    backgroundColor:   LUNA_COLORS.errorLight,
    borderRadius:      borderRadius.sm,
    borderLeftWidth:   3,
    borderLeftColor:   LUNA_COLORS.error,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom:      spacing.md,
  },
  errorText: {
    flex:       1,
    color:      LUNA_COLORS.error,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  submitWrap: {
    marginTop:    spacing.lg,
    marginBottom: spacing.md,
  },

  // ── Lien mot de passe oublié ──────────────────────────────────────────────
  forgotLink: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'center',
    gap:           spacing.xs,
    paddingVertical: spacing.sm,
    marginTop:     spacing.xs,
  },
  forgotLinkPressed: {
    opacity: 0.6,
  },
  forgotText: {
    color:      LUNA_COLORS.secondary,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // ── Hint rôles ───────────────────────────────────────────────────────────
  rolesHint: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.xs,
    marginTop:      spacing.xl,
    paddingHorizontal: spacing.md,
  },
  rolesHintText: {
    fontSize:  fontSize.xs,
    color:     LUNA_COLORS.textDisabled,
    textAlign: 'center',
  },

  // ── Version ───────────────────────────────────────────────────────────────
  versionText: {
    textAlign:  'center',
    fontSize:   fontSize.xs,
    color:      LUNA_COLORS.textDisabled,
    marginTop:  spacing.md,
    letterSpacing: 0.5,
  },
});
