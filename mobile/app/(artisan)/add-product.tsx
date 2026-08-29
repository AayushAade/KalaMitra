import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../../services/productService';

export default function AddProductScreen() {
  const { productData, updateProductData } = useProductCreation();

  const presets = productService.getProductPresets().map(p => ({
    name: p.name,
    raw: p.rawImage,
    enhanced: p.enhancedImage
  }));

  const selectPreset = (raw: string, _enhanced: string, name: string) => {
    updateProductData({ image: raw, enhancedImage: undefined, name: name, step: 2 });
  };

  const handleNext = () => {
    if (productData.image) {
      router.push('/(artisan)/image-enhancement' as any);
    } else {
      alert('Please snap or select a product photo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="Add Product" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Wizard Progress */}
        <View style={styles.wizard}>
          <Text style={styles.wizardLabel}>Step 1 of 5: Photo Capture</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressIndicator, { width: '20%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>1. Snap Product Photo</Text>
          <Text style={styles.sectionSub}>Take a clear picture of your creation right on your workbench.</Text>

          {/* Camera Frame Preview */}
          <View style={styles.cameraFrame}>
            {productData.image ? (
              <Image source={{ uri: productData.image }} style={styles.cameraImage} />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={Colors.border} />
                <Text style={styles.placeholderText}>Tap to capture or choose a preset below</Text>
              </View>
            )}
            <View style={styles.cameraGuide} />
          </View>

          {/* Preset Samples */}
          <View style={styles.presetSection}>
            <Text style={styles.presetLabel}>Or choose a sample craft photo:</Text>
            <View style={styles.presetGrid}>
              {presets.map((p, idx) => {
                const isSelected = productData.name === p.name;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => selectPreset(p.raw, p.enhanced, p.name)}
                    style={[
                      styles.presetItem,
                      isSelected && styles.presetItemSelected,
                    ]}
                  >
                    <Image source={{ uri: p.raw }} style={styles.presetImage} />
                    <Text style={[styles.presetName, isSelected && styles.presetNameSelected]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button
            title="Continue to Enhancement"
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
            disabled={!productData.image}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  cameraFrame: {
    height: 260,
    backgroundColor: '#000000',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  cameraImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.border,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  cameraGuide: {
    position: 'absolute',
    top: 15,
    bottom: 15,
    left: 15,
    right: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    pointerEvents: 'none',
  },
  presetSection: {
    marginBottom: Spacing.xl,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  presetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  presetItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    ...Shadows.soft,
  },
  presetItemSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  presetImage: {
    width: '100%',
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  presetName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  presetNameSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  nextButton: {
    width: '100%',
  },
});
