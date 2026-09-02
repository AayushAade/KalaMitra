import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Button from '../components/Button';

export default function LandingScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoKala}>कला</Text>
            <Text style={styles.logoMitra}>Mitra</Text>
          </View>
          <Text style={styles.tagline}>
            Empowering Heritage, Linking Markets
          </Text>
          <Text style={styles.description}>
            A digital marketplace and smart AI cataloging assistant designed to bridge the gap between traditional craftsmen and modern commerce.
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.promptText}>Choose your profile to begin</Text>
          
          <Button
            title="I'm an Artisan"
            onPress={() => router.push('/(auth)/login' as any)}
            variant="primary"
            style={styles.actionButton}
          />
          
          <Button
            title="I'm a Buyer"
            onPress={() => router.push('/(buyer)/marketplace' as any)}
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
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logoKala: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.primary,
  },
  logoMitra: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.secondary,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
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
    marginBottom: Spacing.md,
    width: '100%',
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
