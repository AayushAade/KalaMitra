import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../../services/productService';

export default function AddProductScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productData, updateProductData } = useProductCreation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(productData.image || null);
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(productData.name || null);

  const presets = productService.getProductPresets().map(p => ({
    name: p.name,
    raw: p.rawImage,
    enhanced: p.enhancedImage
  }));

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        setCapturedUri(photo.uri);
        setSelectedPresetName(null);
        updateProductData({ image: photo.uri, enhancedImage: undefined, name: undefined, step: 2 });
      } else {
        Alert.alert('Capture Failed', 'Could not save the captured photo. Please try again.');
      }
    } catch (err: any) {
      console.error('[AddProduct] Error capturing photo:', err);
      Alert.alert('Camera Error', err.message || 'Failed to capture photo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setCapturedUri(pickedUri);
        setSelectedPresetName(null);
        updateProductData({ image: pickedUri, enhancedImage: undefined, name: undefined, step: 2 });
      }
    } catch (err: any) {
      console.error('[AddProduct] Error picking image:', err);
      Alert.alert('Gallery Error', 'Failed to select image from gallery.');
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setSelectedPresetName(null);
    updateProductData({ image: undefined, enhancedImage: undefined, name: undefined });
  };

  const selectPreset = (raw: string, _enhanced: string, name: string) => {
    setCapturedUri(raw);
    setSelectedPresetName(name);
    updateProductData({ image: raw, enhancedImage: undefined, name: name, step: 2 });
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const handleNext = () => {
    if (capturedUri || productData.image) {
      router.push('/(artisan)/image-enhancement' as any);
    } else {
      Alert.alert('Photo Required', 'Please take a photo or select a craft sample to continue.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Add Product" />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
        {/* Wizard Progress */}
        <View style={[styles.wizard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.wizardLabel, { color: colors.primary }]}>Step 1 of 5: Photo Capture</Text>
          <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
            <View style={[styles.progressIndicator, { width: '20%', backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>1. Snap Product Photo</Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Take a clear picture of your creation right on your workbench.</Text>

          {/* Real Native Camera / Preview Container */}
          <View style={styles.cameraFrame}>
            {capturedUri ? (
              // Captured Photo Preview
              <View style={styles.previewWrapper}>
                <Image source={{ uri: capturedUri }} style={styles.cameraImage} />
                <View style={[
                  styles.previewBadge,
                  {
                    backgroundColor: isDarkMode ? 'rgba(20,27,38,0.92)' : 'rgba(255,255,255,0.92)',
                    borderColor: isDarkMode ? colors.borderLight : 'transparent',
                    borderWidth: isDarkMode ? 1 : 0,
                  },
                ]}>
                  <Ionicons name="checkmark-circle" size={18} color={isDarkMode ? '#4ADE80' : '#2e7d32'} />
                  <Text style={[styles.previewBadgeText, { color: isDarkMode ? '#4ADE80' : '#2e7d32' }]}>
                    {selectedPresetName ? `Sample: ${selectedPresetName}` : 'Photo Captured'}
                  </Text>
                </View>
                <Pressable onPress={handleRetake} style={styles.retakeFloatingButton}>
                  <Ionicons name="camera-reverse-outline" size={20} color={Colors.textLight} />
                  <Text style={styles.retakeFloatingText}>Retake Photo</Text>
                </Pressable>
              </View>
            ) : !permission ? (
              // Loading permission state
              <View style={styles.permissionBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.permissionText, { color: colors.textMuted }]}>Checking camera access...</Text>
              </View>
            ) : !permission.granted ? (
              // Permission Denied State
              <View style={styles.permissionBox}>
                <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.permissionTitle, { color: colors.onBackground }]}>Camera Access Needed</Text>
                <Text style={[styles.permissionSub, { color: colors.textMuted }]}>
                  Please allow camera permissions so you can take live photos of your handcrafted products.
                </Text>
                <Pressable onPress={requestPermission} style={[styles.grantButton, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.grantButtonText, { color: colors.onPrimary }]}>Enable Camera</Text>
                </Pressable>
                <Pressable onPress={handlePickFromGallery} style={styles.galleryFallbackButton}>
                  <Ionicons name="images-outline" size={18} color={colors.primary} />
                  <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>Or choose from Gallery</Text>
                </Pressable>
              </View>
            ) : (
              // Live Native Camera Viewport
              <View style={styles.liveCameraContainer}>
                {Platform.OS !== 'web' ? (
                  <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFillObject}
                    facing={facing}
                  />
                ) : (
                  <View style={styles.webFallbackContainer}>
                    <Ionicons name="camera-outline" size={48} color={colors.primary} />
                    <Text style={[styles.webFallbackText, { color: colors.textMuted }]}>Web Preview - Use Gallery or Preset</Text>
                  </View>
                )}

                {/* Viewfinder Alignment Guide */}
                <View style={styles.cameraGuide} pointerEvents="none">
                  <View style={styles.guideCornerTL} />
                  <View style={styles.guideCornerTR} />
                  <View style={styles.guideCornerBL} />
                  <View style={styles.guideCornerBR} />
                  <Text style={styles.guideHint}>Center product inside frame</Text>
                </View>

                {/* Camera Overlay Controls */}
                <View style={styles.cameraControlsBar}>
                  <Pressable onPress={handlePickFromGallery} style={styles.sideControlBtn}>
                    <Ionicons name="images-outline" size={24} color={Colors.textLight} />
                  </Pressable>

                  <Pressable
                    onPress={handleCapture}
                    disabled={isCapturing}
                    style={({ pressed }) => [
                      styles.shutterButton,
                      pressed && styles.shutterButtonPressed,
                    ]}
                  >
                    {isCapturing ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={styles.shutterInner} />
                    )}
                  </Pressable>

                  <Pressable onPress={toggleFacing} style={styles.sideControlBtn}>
                    <Ionicons name="camera-reverse-outline" size={24} color={Colors.textLight} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Preset / Sample Craft Photos (For rapid demo and testing) */}
          <View style={styles.presetSection}>
            <View style={styles.presetHeaderRow}>
              <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              <Text style={[styles.presetLabel, { color: colors.onBackground }]}>Or choose a sample craft photo:</Text>
            </View>
            <View style={styles.presetGrid}>
              {presets.map((p, idx) => {
                const isSelected = selectedPresetName === p.name;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => selectPreset(p.raw, p.enhanced, p.name)}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: isDarkMode ? '#13171F' : colors.background,
                        borderColor: colors.borderLight,
                      },
                      isSelected && {
                        borderColor: colors.primary,
                        borderWidth: 2,
                        backgroundColor: colors.card,
                      },
                    ]}
                  >
                    <Image source={{ uri: p.raw }} style={styles.presetImage} />
                    {isSelected && (
                      <View style={[styles.presetCheckmark, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                      </View>
                    )}
                    <Text
                      style={[
                        styles.presetName,
                        { color: colors.onBackground },
                        isSelected && { color: colors.primary, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Action Button */}
          <Button
            title="Continue to Enhancement"
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
            disabled={!capturedUri && !productData.image}
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
    paddingBottom: Spacing.xl,
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
    borderRadius: BorderRadius.full,
  },
  content: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  cameraFrame: {
    width: '100%',
    height: 380,
    backgroundColor: '#111',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveCameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  webFallbackText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  cameraGuide: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCornerTL: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  guideCornerTR: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  guideCornerBL: {
    position: 'absolute',
    bottom: 90,
    left: 30,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  guideCornerBR: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  guideHint: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    position: 'absolute',
    top: 12,
  },
  cameraControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
  },
  shutterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  shutterButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  sideControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#1a1a1a',
  },
  previewBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadows.soft,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  retakeFloatingButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeFloatingText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  permissionBox: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  permissionSub: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  permissionText: {
    color: '#bbb',
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  grantButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  grantButtonText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: 14,
  },
  galleryFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  galleryFallbackText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  presetSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  presetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetItem: {
    width: '31%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    position: 'relative',
  },
  presetItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
    ...Shadows.soft,
  },
  presetImage: {
    width: '100%',
    height: 60,
    borderRadius: BorderRadius.xs,
    resizeMode: 'cover',
    marginBottom: 4,
  },
  presetCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  presetNameSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  nextButton: {
    marginTop: Spacing.xs,
  },
});
