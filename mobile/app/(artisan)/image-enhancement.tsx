import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { imageService } from '../../services/imageService';

interface StyleOption {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const VISUAL_STYLES: StyleOption[] = [
  {
    id: 'CLEAN_ECOMMERCE',
    name: 'Clean Catalogue',
    description: 'Amazon-style seamless studio white with contact shadow',
    icon: 'cube-outline',
  },
  {
    id: 'LUXURY_STUDIO',
    name: 'Luxury Studio',
    description: 'Tata CLiQ Luxury warm ivory & architectural podium',
    icon: 'sparkles-outline',
  },
  {
    id: 'INDIAN_HERITAGE',
    name: 'Indian Heritage',
    description: 'Warm terracotta tones celebrating craft culture',
    icon: 'flame-outline',
  },
  {
    id: 'NATURAL_ARTISAN',
    name: 'Natural Artisan',
    description: 'Organic daylight, linen & sustainable earthy aesthetic',
    icon: 'leaf-outline',
  },
];

export default function ImageEnhancementScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productData, updateProductData } = useProductCreation();
  const [selectedStyle, setSelectedStyle] = useState<string>('CLEAN_ECOMMERCE');
  const selectedCategory = productData.category || 'GENERIC_HANDICRAFT';
  const [loading, setLoading] = useState(false);
  const [hasEnhanced, setHasEnhanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'enhanced' | 'original'>('enhanced');
  const [error, setError] = useState<string | null>(null);

  const triggerEnhancement = useCallback(
    async (styleToUse?: string) => {
      if (!productData.image) {
        setError('No product photo found. Please go back and select a photo.');
        return;
      }

      const activeStyle = styleToUse || selectedStyle;
      setLoading(true);
      setError(null);
      try {
        const result = await imageService.enhanceImage(productData.image, {
          productCategory: selectedCategory,
          productName: productData.name,
          productDescription: productData.descriptionEnglish,
          style: activeStyle,
        });

        updateProductData({ enhancedImage: result.enhancedUrl });
        setHasEnhanced(true);
        setActiveTab('enhanced');
      } catch (err: any) {
        console.error('[ImageEnhancement] Studio enhancement failure:', err);
        setError(err.message || 'Image enhancement failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [productData.image, productData.name, productData.descriptionEnglish, selectedCategory, selectedStyle, updateProductData]
  );

  // Run automatically on first mount if not yet enhanced
  useEffect(() => {
    if (productData.image && !hasEnhanced && !productData.enhancedImage) {
      triggerEnhancement();
    } else if (productData.enhancedImage) {
      setHasEnhanced(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectStyle = (styleId: string) => {
    setSelectedStyle(styleId);
    if (hasEnhanced) {
      triggerEnhancement(styleId);
    }
  };

  const handleAccept = () => {
    if (!productData.enhancedImage) return;
    updateProductData({ step: 3 });
    router.push('/(artisan)/voice' as any);
  };

  const handleRetake = () => {
    updateProductData({ image: undefined, enhancedImage: undefined });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack={true} title="AI Artisan Studio" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Wizard Progress */}
        <View style={[styles.wizard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.wizardLabel, { color: colors.primary }]}>Step 2 of 5: AI Photography Studio</Text>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressIndicator, { backgroundColor: colors.primary, width: '40%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.onBackground }]}>AI Product Photography</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Transform your smartphone photo into a luxury e-commerce catalogue image with studio lighting & realistic contact shadows.
          </Text>

          {/* Style Selector Chips */}
          <Text style={[styles.sectionHeader, { color: colors.onBackground }]}>Choose Visual Style</Text>
          <View style={styles.styleGrid}>
            {VISUAL_STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleCard,
                    { backgroundColor: colors.card, borderColor: colors.borderLight },
                    isSelected && { borderColor: colors.primary, backgroundColor: isDarkMode ? 'rgba(158, 42, 43, 0.2)' : 'rgba(158, 42, 43, 0.05)' },
                  ]}
                  onPress={() => handleSelectStyle(style.id)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <View style={[styles.styleIconWrap, { backgroundColor: isDarkMode ? 'rgba(158, 42, 43, 0.3)' : 'rgba(158, 42, 43, 0.1)' }, isSelected && { backgroundColor: colors.primary }]}>
                    <Ionicons
                      name={style.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  <Text style={[styles.styleName, { color: colors.onBackground }, isSelected && { color: colors.primary }]}>
                    {style.name}
                  </Text>
                  <Text style={[styles.styleDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {style.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Main Stage / Loading / Error Display */}
          {loading ? (
            <View style={[styles.loaderContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loaderText, { color: colors.onBackground }]}>Creating your professional product photo...</Text>
              <Text style={[styles.loaderSub, { color: colors.textMuted }]}>
                Preserving authentic craft textures & staging studio lighting
              </Text>
            </View>
          ) : error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Ionicons name="alert-circle" size={44} color={Colors.error} />
              <Text style={styles.errorTitle}>Enhancement Notice</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Retry Enhancement"
                onPress={() => triggerEnhancement()}
                variant="primary"
                style={styles.retryButton}
              />
            </View>
          ) : (
            <View style={styles.previewContainer}>
              {/* Image Frame with Before/After */}
              <View style={[styles.imageFrame, { borderColor: colors.borderLight, backgroundColor: isDarkMode ? '#1E1E1E' : '#FAFAFA' }]}>
                <Image
                  source={{
                    uri:
                      activeTab === 'enhanced' && productData.enhancedImage
                        ? productData.enhancedImage
                        : productData.image,
                  }}
                  style={styles.image}
                  resizeMode="contain"
                />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {activeTab === 'enhanced' && productData.enhancedImage
                      ? '✨ STUDIO CATALOGUE'
                      : 'RAW SMARTPHONE PHOTO'}
                  </Text>
                </View>
              </View>

              {/* Before / After Switcher */}
              <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <TouchableOpacity
                  style={[styles.toggleBtn, activeTab === 'original' && { backgroundColor: colors.primary }]}
                  onPress={() => setActiveTab('original')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: colors.textMuted },
                      activeTab === 'original' && { color: '#FFFFFF' },
                    ]}
                  >
                    Original Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    activeTab === 'enhanced' && { backgroundColor: colors.primary },
                    !productData.enhancedImage && styles.toggleBtnDisabled,
                  ]}
                  onPress={() => setActiveTab('enhanced')}
                  disabled={!productData.enhancedImage}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: colors.textMuted },
                      activeTab === 'enhanced' && { color: '#FFFFFF' },
                    ]}
                  >
                    ✨ Enhanced Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Product Preservation Guarantee Box */}
              <View style={[styles.preservationBox, { backgroundColor: isDarkMode ? 'rgba(158, 42, 43, 0.15)' : 'rgba(158, 42, 43, 0.04)', borderColor: isDarkMode ? colors.primary : 'rgba(158, 42, 43, 0.15)' }]}>
                <View style={styles.preservationHeader}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                  <Text style={[styles.preservationTitle, { color: colors.primary }]}>Product Details 100% Preserved</Text>
                </View>
                <Text style={[styles.preservationText, { color: colors.onBackground }]}>
                  Your handcrafted item geometry, materials, and colors are untouched. Background clutter has been replaced with commercial studio lighting.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonStack}>
                <Button
                  title="✨ Use This Photo"
                  onPress={handleAccept}
                  variant="primary"
                  style={styles.mainActionBtn}
                  disabled={!productData.enhancedImage}
                />
                <View style={styles.buttonRow}>
                  <Button
                    title="Try Another Style"
                    onPress={() => triggerEnhancement()}
                    variant="secondary"
                    style={styles.halfBtn}
                  />
                  <Button
                    title="Retake Photo"
                    onPress={handleRetake}
                    variant="secondary"
                    style={styles.halfBtn}
                  />
                </View>
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
  },
  scrollContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.md,
  },
  wizard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.soft,
    marginBottom: Spacing.md,
  },
  wizardLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  styleCard: {
    width: '48%',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1.5,
    ...Shadows.soft,
  },
  styleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  styleName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  styleDesc: {
    fontSize: 10,
    lineHeight: 13,
  },
  loaderContainer: {
    height: 280,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.soft,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  loaderSub: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  errorContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.soft,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  retryButton: {
    minWidth: 160,
  },
  previewContainer: {
    width: '100%',
  },
  imageFrame: {
    height: 280,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  image: {
    width: '100%',
    height: '100%',
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
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  toggleBtnDisabled: {
    opacity: 0.5,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  preservationBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  preservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  preservationTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  preservationText: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonStack: {
    gap: Spacing.sm,
  },
  mainActionBtn: {
    height: 48,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfBtn: {
    flex: 1,
    height: 42,
  },
});
