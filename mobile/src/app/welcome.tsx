import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  accent: string;
}

function FeatureCard({ icon, title, description, accent }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <View style={[styles.featureIconBg, { backgroundColor: `${accent}18` }]}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <View style={styles.featureBody}>
        <Text style={[styles.featureTitle, { color: accent }]}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router     = useRouter();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LUNA_COLORS.background} />

      {/* Decorative shapes */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoGlass}>
            <Image
              source={require('@/src/images/logo2.jpeg')}
              style={styles.logoHero}
              resizeMode="contain"
            />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PLATEFORME MÉDICALE</Text>
          </View>
        </Animated.View>

        {/* Slogan + description */}
        <Animated.View
          style={[
            styles.sloganBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.slogan}>Votre Santé, Notre Priorité</Text>
          <Text style={styles.description}>
            Accédez à vos consultations, dossiers médicaux et suivez votre santé en toute sécurité.
          </Text>
          <View style={styles.divider} />
        </Animated.View>

        {/* Feature cards */}
        <Animated.View
          style={[
            styles.featuresBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <FeatureCard
            icon="🩺"
            title="Consultations"
            description="Prenez rendez-vous et consultez vos médecins"
            accent={LUNA_COLORS.accentOrange}
          />
          <FeatureCard
            icon="📋"
            title="Dossier médical"
            description="Accédez à votre historique médical complet"
            accent={LUNA_COLORS.accentGold}
          />
          <FeatureCard
            icon="🕐"
            title="Suivi 24/7"
            description="Restez connecté à votre équipe soignante"
            accent={LUNA_COLORS.secondary}
          />
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonsBlock, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>

          
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LUNA_COLORS.background,
  },
  shape1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: LUNA_COLORS.secondary,
    opacity: 0.06,
    top: -(width * 0.3),
    right: -(width * 0.2),
  },
  shape2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: LUNA_COLORS.tertiary,
    opacity: 0.06,
    bottom: -(width * 0.15),
    left: -(width * 0.1),
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 72 : 56,
    marginBottom: 28,
  },
  logoGlass: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: LUNA_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: LUNA_COLORS.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  logoHero: {
    width: 88,
    height: 88,
    borderRadius: 16,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: LUNA_COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: LUNA_COLORS.border,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: LUNA_COLORS.secondary,
    letterSpacing: 1.5,
  },
  sloganBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 22,
    fontWeight: '700',
    color: LUNA_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: LUNA_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.75,
    paddingHorizontal: 8,
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: LUNA_COLORS.primary,
    marginTop: 24,
    marginBottom: 20,
  },
  featuresBlock: {
    width: '100%',
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: LUNA_COLORS.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  featureIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 13,
    color: LUNA_COLORS.textSecondary,
    lineHeight: 18,
    opacity: 0.75,
  },
  buttonsBlock: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: LUNA_COLORS.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  loginText: {
    fontSize: 17,
    fontWeight: '700',
    color: LUNA_COLORS.textInverse,
    letterSpacing: 0.5,
  },
  registerLink: {
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
    color: LUNA_COLORS.textSecondary,
  },
  registerTextBold: {
    fontWeight: '700',
    color: LUNA_COLORS.secondary,
  },
});
