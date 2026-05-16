import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuthStore } from '@/src/store/auth.store';
import { ROLE_ROUTES } from '@/src/constants/roles';
import { LUNA_COLORS } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const circle1Scale   = useRef(new Animated.Value(0)).current;
  const circle1Opacity = useRef(new Animated.Value(0)).current;
  const circle2Scale   = useRef(new Animated.Value(0)).current;
  const circle2Opacity = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const loadingWidth   = useRef(new Animated.Value(0)).current;

  // Lire l'état auth en UNE FOIS pour éviter les re-renders partiels
  const { token, role, estCabinet, isRehydrated } = useAuthStore();

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(circle1Scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(circle1Opacity, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.spring(circle2Scale, { toValue: 1, friction: 6, tension: 60, delay: 150, useNativeDriver: true }),
        Animated.timing(circle2Opacity, { toValue: 0.1, duration: 600, delay: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.timing(loadingWidth, {
      toValue: width * 0.6,
      duration: 2200,
      useNativeDriver: false,
    }).start();

    // Attendre la rehydratation + durée minimale du splash
    const timer = setTimeout(() => {
      if (!isRehydrated) {
        // Store pas encore prêt → attendre sur welcome
        router.replace('/welcome');
        return;
      }

      if (token && role) {
        // Déjà connecté → rediriger directement vers le dashboard
        const dest = ROLE_ROUTES[role] || ROLE_ROUTES[role.replace('ROLE_', '')];
        router.replace(dest as any);
      } else {
        // Non connecté → welcome
        router.replace('/welcome');
      }
    }, 2500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRehydrated]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LUNA_COLORS.primary} />

      <Animated.View
        style={[
          styles.circle1,
          { transform: [{ scale: circle1Scale }], opacity: circle1Opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.circle2,
          { transform: [{ scale: circle2Scale }], opacity: circle2Opacity },
        ]}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Image
          source={require('@/src/images/logo2.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.title}>Clinix</Text>
        <Text style={styles.tagline}>Votre Santé, Notre Priorité</Text>
      </Animated.View>

      <View style={styles.loadingTrack}>
        <Animated.View style={[styles.loadingBar, { width: loadingWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LUNA_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: LUNA_COLORS.secondary,
    top: -(width * 0.25),
    right: -(width * 0.2),
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: LUNA_COLORS.tertiary,
    bottom: -(width * 0.2),
    left: -(width * 0.15),
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: LUNA_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: LUNA_COLORS.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: LUNA_COLORS.darkest,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: LUNA_COLORS.tertiary,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  loadingTrack: {
    position: 'absolute',
    bottom: 60,
    width: width * 0.6,
    height: 4,
    borderRadius: 2,
    backgroundColor: LUNA_COLORS.surfaceLight,
    overflow: 'hidden',
  },
  loadingBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: LUNA_COLORS.secondary,
  },
});
