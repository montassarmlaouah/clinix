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
import { borderRadius, spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight, typography } from '@/src/theme/typography';

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
      const estCabinet = !!(data.user?.estCabinet);

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
      });

      // ── Mapping rôle → route ────────────────────────────────────
      const roleRoutes: Record<string, string> = {
        ...ROLE_ROUTES,
        'ROLE_SUPER_ADMIN':    '/(superadmin)/dashboard',
        'ROLE_ADMIN_CLINIQUE': '/(admin)/dashboard',
        'ROLE_SECRETAIRE':             '/(secretaire)',
        'ROLE_MEDECIN':                '/(medecin)',
        'ROLE_INFIRMIER':              '/(infirmier)/soins',
        'ROLE_RADIOLOGUE':             '/(radiologue)',
        'ROLE_PHARMACIEN':             '/(pharmacien)/stock',
        'ROLE_PATIENT':                '/(patient)/dossier',
        'ROLE_CHEF_PERSONNEL':         '/(chef-personnel)',
        'ROLE_TECHNICIEN_MAINTENANCE': '/(technicien)/equipements',
        'SUPER_ADMIN':                 '/(superadmin)/dashboard',
        'ADMIN_CLINIQUE':              '/(admin)/dashboard',
        'SECRETAIRE':                  '/(secretaire)',
        'MEDECIN':                     '/(medecin)',
        'INFIRMIER':                   '/(infirmier)/soins',
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── En-tête / Logo ── */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/src/images/logo2.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[typography.bodySmall, styles.subtitle]}>
              Espace professionnel
            </Text>
          </View>

          {/* ── Formulaire ── */}
          <Card style={styles.formCard}>
            <Input
              label="Identifiant"
              value={telephone}
              onChangeText={setTelephone}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Tél. ou super.admin"
              returnKeyType="next"
              leftIcon={
                <Ionicons
                  name="call-outline"
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
          </Card>

          {/* ── Mot de passe oublié ── */}
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={({ pressed }) => [styles.forgotLink, pressed && styles.forgotLinkPressed]}
            accessibilityRole="button"
            accessibilityLabel="Mot de passe oublié"
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </Pressable>
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
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.huge,
  },

  // En-tête
  header: {
    alignItems:   'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width:           120,
    height:          120,
    borderRadius:    borderRadius.xl,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.lg,
    overflow:        'hidden',
  },
  logo: {
    width:  88,
    height: 88,
  },
  subtitle: {
    color: LUNA_COLORS.textSecondary,
  },

  // Formulaire
  formCard: {
    padding: spacing.xxl,
  },
  errorBox: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.xs,
    backgroundColor: LUNA_COLORS.errorLight,
    borderRadius:   borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom:   spacing.md,
  },
  errorText: {
    flex:       1,
    color:      LUNA_COLORS.error,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  submitWrap: {
    marginTop: spacing.md,
  },

  // Lien bas de page
  forgotLink: {
    alignItems: 'center',
    marginTop:  spacing.xl,
    padding:    spacing.sm,
  },
  forgotLinkPressed: {
    opacity: 0.6,
  },
  forgotText: {
    color:      LUNA_COLORS.secondary,
    fontSize:   fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
