import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ImageEnhancementScreen() {
  const { productData, updateProductData } = useProductCreation();
  const [loading, setLoading] = useState(true);
  const [showEnhanced, setShowEnhanced] = useState(false);

  useEffect(() => {
    // Simulate AI image processing
    const timer = setTimeout(() => {
      setLoading(false);
      setShowEnhanced(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    updateProductData({ step: 3 });
    router.push('/(artisan)/voice' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="AI Image Studio" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Wizard Progress */}
        <View style={styles.wizard}>
          <Text style={styles.wizardLabel}>Step 2 of 5: AI Image Enhancement</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressIndicator, { width: '40%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>AI Image Enhancement</Text>
          <Text style={styles.subtitle}>Our AI adjusts lighting, colors, and removes background clutter.</Text>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>Cleaning background clutter...</Text>
              <Text style={styles.loaderSub}>Optimizing lighting parameters for e-commerce</Text>
            </View>
          ) : (
            <View style={styles.previewContainer}>
              {/* Image Frame */}
              <View style={styles.imageFrame}>
                <Image
                  source={{ uri: showEnhanced ? productData.enhancedImage : productData.image }}
                  style={styles.image}
                />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {showEnhanced ? '✨ AI ENHANCED' : 'ORIGINAL'}
                  </Text>
                </View>
              </View>

              {/* Toggles */}
              <View style={styles.toggleRow}>
                <Button
                  title="Original"
                  onPress={() => setShowEnhanced(false)}
                  variant={!showEnhanced ? 'primary' : 'secondary'}
                  style={styles.toggleButton}
                />
                <Button
                  title="AI Enhanced"
                  onPress={() => setShowEnhanced(true)}
                  variant={showEnhanced ? 'primary' : 'secondary'}
                  style={styles.toggleButton}
                />
              </View>

              <View style={styles.benefitContainer}>
                <Text style={styles.benefitTitle}>👍 Enhancement Complete!</Text>
                <Text style={styles.benefitText}>
                  Isolated foreground subject, neutralized workshop shadows, and added soft ambient lighting to increase buyer trust by 40%.
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <Button
                  title="Retry"
                  onPress={() => {
                    setLoading(true);
                    setTimeout(() => setLoading(false), 1500);
                  }}
                  variant="secondary"
                  style={styles.actionBtn}
                />
                <Button
                  title="Accept & Continue"
                  onPress={handleAccept}
                  variant="primary"
                  style={styles.actionBtn}
                />
              </View>
            </View>
          )}
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
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.md,
  },
  wizard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    marginBottom: Spacing.md,
  },
  wizardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  loaderContainer: {
    height: 260,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
    marginTop: Spacing.md,
  },
  loaderSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
  },
  imageFrame: {
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative',
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(27,28,26,0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textLight,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    height: 40,
  },
  benefitContainer: {
    backgroundColor: 'rgba(0, 97, 149, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 97, 149, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.tertiary,
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
