import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function LandingScreen() {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]} bounces={false}>
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.logoCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Heritage Emblem */}
            <View style={styles.emblemContainer}>
              <View style={[styles.emblemRing, isDarkMode && { backgroundColor: 'rgba(29,114,184,0.15)', borderColor: 'rgba(29,114,184,0.35)' }]}>
                <Ionicons name="flower-outline" size={26} color={isDarkMode ? colors.primary : '#94442E'} />
              </View>
            </View>

            {/* Brand Logo: कला (Brown/Terracotta) + Mitra (Complementary Blue) */}
            <View style={styles.logoContainer}>
              <Text style={[styles.logoKala, isDarkMode && { color: '#E07A5F', textShadowColor: 'rgba(224,122,95,0.2)' }]}>कला</Text>
              <Text style={[styles.logoMitra, isDarkMode && { color: '#38BDF8', textShadowColor: 'rgba(56,189,248,0.2)' }]}>Mitra</Text>
            </View>

            {/* Handcrafted Indian Heritage Flourish */}
            <View style={styles.flourishRow}>
              <View style={[styles.flourishLine, isDarkMode && { backgroundColor: 'rgba(56,189,248,0.3)' }]} />
              <Text style={[styles.flourishDot, isDarkMode && { color: colors.primary }]}>✦</Text>
              <View style={[styles.flourishLine, isDarkMode && { backgroundColor: 'rgba(56,189,248,0.3)' }]} />
            </View>

            <Text style={[styles.heritageSubtitle, isDarkMode && { color: colors.tertiary }]}>INDIAN HANDICRAFTS PLATFORM</Text>
          </Animated.View>
        </View>

        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.promptText, { color: colors.onBackground }]}>Choose your profile to begin</Text>
          
          <Button
            title="Artisan Login / Start Selling"
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'artisan' } } as any)}
            variant="primary"
            style={styles.actionButton}
          />
          
          <Button
            title="Buyer Login / Explore Marketplace"
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'buyer' } } as any)}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.marginMobile,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  logoCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
  },
  emblemContainer: {
    marginBottom: Spacing.sm,
  },
  emblemRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(148,68,46,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(148,68,46,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  logoKala: {
    fontSize: 64,
    fontWeight: '900',
    color: '#94442E',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(148,68,46,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  logoMitra: {
    fontSize: 62,
    fontWeight: '800',
    color: '#006195',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,97,149,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  flourishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  flourishLine: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(148,68,46,0.3)',
  },
  flourishDot: {
    fontSize: 10,
    color: '#94442E',
  },
  heritageSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94442E',
    letterSpacing: 2,
    opacity: 0.85,
  },
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    width: '100%',
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    width: '100%',
    minHeight: 56,
    marginBottom: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
