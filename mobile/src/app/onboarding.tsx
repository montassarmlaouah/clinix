import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LUNA_COLORS } from '@/src/theme/colors';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🏥',
    title: 'Bienvenue sur Clinix',
    text: 'La plateforme médicale qui connecte patients et professionnels de santé',
  },
  {
    id: '2',
    emoji: '📅',
    title: 'Gérez vos rendez-vous',
    text: 'Planifiez, modifiez et suivez vos consultations en temps réel',
  },
  {
    id: '3',
    emoji: '🔒',
    title: 'Vos données en sécurité',
    text: 'Dossier médical chiffré, accès sécurisé par authentification',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef  = useRef<FlatList<Slide>>(null);
  const contentFade  = useRef(new Animated.Value(1)).current;

  const animateToSlide = (nextIndex: number) => {
    Animated.sequence([
      Animated.spring(contentFade, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(contentFade, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  };

  const finishOnboarding = () => {
    router.replace('/welcome');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      animateToSlide(currentIndex + 1);
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideText}>{item.text}</Text>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LUNA_COLORS.background} />

      {/* Skip link — slides 1 & 2 only */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.View style={[styles.slidesWrapper, { opacity: contentFade }]}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </Animated.View>

      {/* Pagination dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Next / Commencer button */}
      <TouchableOpacity
        style={styles.button}
        onPress={isLast ? finishOnboarding : handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LUNA_COLORS.background,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: LUNA_COLORS.secondary,
  },
  slidesWrapper: {
    flex: 1,
    width: '100%',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  illustrationContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: LUNA_COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: LUNA_COLORS.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  emoji: {
    fontSize: 80,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: LUNA_COLORS.darkest,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  slideText: {
    fontSize: 16,
    color: LUNA_COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    borderRadius: 10,
  },
  dotActive: {
    width: 24,
    height: 8,
    backgroundColor: LUNA_COLORS.secondary,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: LUNA_COLORS.primary,
  },
  button: {
    width: width - 64,
    height: 54,
    borderRadius: 27,
    backgroundColor: LUNA_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
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
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: LUNA_COLORS.textInverse,
    letterSpacing: 0.5,
  },
});
