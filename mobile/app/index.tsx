import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';

export default function LandingScreen() {
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <Text style={styles.logoKala}>कला</Text>
            <Text style={styles.logoMitra}>Mitra</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.subtitleBadge,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.badgeDot} />
            <Text style={styles.subtitleBadgeText}>HERITAGE CRAFT MARKETPLACE</Text>
          </Animated.View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.promptText}>Choose your profile to begin</Text>
          
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
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>SIH 2026 Project • KalaMitra</Text>
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
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoKala: {
    fontSize: 58,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(148,68,46,0.12)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  logoMitra: {
    fontSize: 58,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  subtitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148,68,46,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,68,46,0.18)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
    marginTop: Spacing.xs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  subtitleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.1,
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
    marginVertical: Spacing.lg,
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
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: Spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
