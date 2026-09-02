import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { pricingService } from '../../services/pricingService';
import { artisanService } from '../../services/artisanService';
import { PricingRecommendation } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type CraftLevel = 'basic' | 'skilled' | 'intricate';

export default function PricingScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productData, updateProductData, resetProductData } = useProductCreation();
  const { addProduct } = useProductCatalog();

  // Artisan Inputs
  const [matCost, setMatCost] = useState(
    productData.materialCost ? String(productData.materialCost) : '600'
  );
  const [timeHours, setTimeHours] = useState(
    productData.timeSpentHours ? String(productData.timeSpentHours) : '5'
  );
  const [craftLevel, setCraftLevel] = useState<CraftLevel>(
    (productData.craftsmanshipLevel as CraftLevel) || 'skilled'
  );

  // Dynamic Pricing State
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [finalPrice, setFinalPrice] = useState('1850');
  const [publishing, setPublishing] = useState(false);

  const debounceTimer = useRef<any>(null);

  // Function to request AI Dynamic Pricing Recommendation
  const fetchPricing = async (
    material: number,
    hours: number,
    level: CraftLevel
  ) => {
    setLoading(true);
    try {
      const rec = await pricingService.getRecommendation({
        productName: productData.name || 'Handcrafted Product',
        category: productData.category,
        material: productData.material,
        craftType: productData.craft,
        materialCost: material,
        timeSpentHours: hours,
        craftsmanshipLevel: level,
        tags: productData.tags,
      });
      setRecommendation(rec);
      setFinalPrice(rec.recommendedPrice.toString());
      updateProductData({
        materialCost: material,
        timeSpentHours: hours,
        craftsmanshipLevel: level,
        aiSuggestedPrice: rec.recommendedPrice,
        priceRange: { min: rec.minPrice, max: rec.maxPrice },
        explanation: rec.summaryExplanation,
      });
    } catch (err: any) {
      console.warn('[PricingScreen] Failed to fetch dynamic pricing:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger pricing calculation on mount and when inputs change
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const mat = parseFloat(matCost) || 0;
      const hours = parseFloat(timeHours) || 0;
      fetchPricing(mat, hours, craftLevel);
    }, 450);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matCost, timeHours, craftLevel]);

  // Adjust price helper
  const adjustPrice = (delta: number) => {
    const current = parseFloat(finalPrice) || (recommendation?.recommendedPrice ?? 0);
    const updated = Math.max(0, current + delta);
    setFinalPrice(updated.toString());
  };

  const applySuggested = () => {
    if (recommendation) {
      setFinalPrice(recommendation.recommendedPrice.toString());
    }
  };

  const handlePublish = async () => {
    const finalPriceVal = parseFloat(finalPrice) || (recommendation?.recommendedPrice ?? 1500);
    setPublishing(true);

    try {
      // Build the complete product listing
      const newProduct = {
        name: productData.name || 'Handcrafted Product',
        imageUrl: productData.enhancedImage || productData.image || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
        originalImageUrl: productData.image,
        material: productData.material || 'Natural Materials',
        craft: productData.craft || 'Traditional Handicrafts',
        productionTime: productData.productionTime || `${timeHours || '5'} hours`,
        price: finalPriceVal,
        descriptionEnglish: productData.descriptionEnglish,
        descriptionHindi: productData.descriptionHindi,
        voiceTranscript: productData.voiceText,
        tags: productData.tags || [],
        artisanName: artisanService.getCurrentArtisan().name || artisanService.getCurrentArtisan().ownerName || 'My Store',
      };

      // Save listing into Supabase database & runtime state
      await addProduct(newProduct);

      // Reset creation wizard state
      resetProductData();

      Alert.alert('Success', 'Product published successfully to the marketplace!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(artisan)/artisan-catalogue' as any),
        },
      ]);
    } catch (err: any) {
      console.error('[PricingScreen] Failed to publish product:', err);
      Alert.alert('Publish Failed', err.message || 'Failed to publish product to the marketplace. Please check your connection.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="AI Pricing Studio" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          {/* Wizard Progress */}
          <View style={[styles.wizard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.wizardLabel, { color: colors.primary }]}>Step 5 of 5: AI Fair Price Assistant</Text>
            <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
              <View style={[styles.progressIndicator, { width: '100%', backgroundColor: colors.primary }]} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.onBackground }]}>Calculate Fair Value</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Enter your material and craft time. AI analyzes market rates to ensure fair earnings.
            </Text>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              {/* Artisan Inputs Section */}
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: colors.onBackground }]}>Material Cost (₹)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                    keyboardType="decimal-pad"
                    value={matCost}
                    onChangeText={setMatCost}
                    placeholder="e.g. 600"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: colors.onBackground }]}>Time Spent (Hours)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                    keyboardType="decimal-pad"
                    value={timeHours}
                    onChangeText={setTimeHours}
                    placeholder="e.g. 5"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Craftsmanship Level Picker */}
              <View style={styles.craftLevelSection}>
                <Text style={[styles.inputLabel, { color: colors.onBackground }]}>Craftsmanship & Complexity</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight },
                      craftLevel === 'basic' && { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.2)' : Colors.primaryContainer, borderColor: colors.primary },
                    ]}
                    onPress={() => setCraftLevel('basic')}
                  >
                    <Text style={[styles.chipText, { color: colors.textMuted }, craftLevel === 'basic' && { color: colors.primary, fontWeight: '700' }]}>
                      Basic
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight },
                      craftLevel === 'skilled' && { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.2)' : Colors.primaryContainer, borderColor: colors.primary },
                    ]}
                    onPress={() => setCraftLevel('skilled')}
                  >
                    <Text style={[styles.chipText, { color: colors.textMuted }, craftLevel === 'skilled' && { color: colors.primary, fontWeight: '700' }]}>
                      Skilled
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.chip,
                      { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight },
                      craftLevel === 'intricate' && { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.2)' : Colors.primaryContainer, borderColor: colors.primary },
                    ]}
                    onPress={() => setCraftLevel('intricate')}
                  >
                    <Text style={[styles.chipText, { color: colors.textMuted }, craftLevel === 'intricate' && { color: colors.primary, fontWeight: '700' }]}>
                      Highly Intricate
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* AI Pricing Recommendation Outcome */}
              <View style={[styles.aiOutputBox, { backgroundColor: isDarkMode ? '#172230' : 'rgba(0, 97, 149, 0.05)', borderColor: isDarkMode ? colors.borderLight : 'rgba(0, 97, 149, 0.15)' }]}>
                {loading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.primary }]}>Analyzing market benchmarks & cost basis...</Text>
                  </View>
                ) : recommendation ? (
                  <>
                    <View style={styles.outcomeHeaderRow}>
                      <Text style={[styles.suggestedLabel, { color: colors.primary }]}>💡 Recommended Price</Text>
                      {recommendation.dataSourceType === 'live_market_data' ? (
                        <View style={[styles.confidenceBadge, styles.badgeHigh]}>
                          <Ionicons name="globe-outline" size={12} color="#2E7D32" />
                          <Text style={styles.badgeTextHigh}>Live Market Data</Text>
                        </View>
                      ) : recommendation.dataSourceType === 'cost_only' ? (
                        <View style={[styles.confidenceBadge, styles.badgeCost]}>
                          <Ionicons name="shield-checkmark" size={12} color="#E65100" />
                          <Text style={styles.badgeTextCost}>Cost-Based Recommendation</Text>
                        </View>
                      ) : (
                        <View style={[styles.confidenceBadge, styles.badgeMedium]}>
                          <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
                          <Text style={[styles.badgeTextMedium, { color: colors.primary }]}>Craft Category Benchmark</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.sourceDescText, { color: colors.textMuted }]}>
                      {recommendation.dataSourceDescription ||
                        (recommendation.dataSourceType === 'cost_only'
                          ? 'Market comparison was unavailable, so this recommendation is based on your making costs.'
                          : 'Based on curated Indian handicraft category price benchmarks.')}
                    </Text>

                    <Text style={[styles.suggestedValue, { color: colors.primary }]}>₹{recommendation.recommendedPrice.toLocaleString('en-IN')}</Text>

                    {recommendation.dataSourceType !== 'cost_only' && (
                      <Text style={[styles.rangeText, { color: colors.textMuted }]}>
                        Category Benchmark Range: ₹{recommendation.minPrice.toLocaleString('en-IN')} – ₹{recommendation.maxPrice.toLocaleString('en-IN')}
                      </Text>
                    )}

                    {/* "Why this price?" Explainability Box */}
                    <View style={[styles.explainCard, { backgroundColor: isDarkMode ? '#13171F' : Colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[styles.explainTitle, { color: colors.onBackground }]}>Why this price?</Text>
                      {recommendation.explanationPoints && recommendation.explanationPoints.length > 0 ? (
                        recommendation.explanationPoints.map((point, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <Text style={styles.bulletCheck}>✓</Text>
                            <Text style={[styles.bulletText, { color: colors.textMuted }]}>{point}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.bulletText, { color: colors.textMuted }]}>{recommendation.explanation}</Text>
                      )}
                    </View>

                    <Button
                      title="Apply AI Suggested Price"
                      onPress={applySuggested}
                      variant="secondary"
                      style={styles.applyBtn}
                    />
                  </>
                ) : null}
              </View>

              {/* Final Selling Price Customization */}
              <View style={[styles.finalSection, { borderTopColor: colors.borderLight }]}>
                <View style={styles.finalHeaderRow}>
                  <Text style={[styles.finalLabel, { color: colors.onBackground }]}>Your Selling Price (₹)</Text>
                  <Text style={[styles.finalSub, { color: colors.textMuted }]}>You have final control over your price</Text>
                </View>

                <View style={styles.priceAdjustRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.adjustBtn,
                      { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : Colors.primaryContainer },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => adjustPrice(-100)}
                  >
                    <Text style={[styles.adjustBtnText, { color: colors.primary }]}>- ₹100</Text>
                  </Pressable>

                  <TextInput
                    style={[styles.finalInput, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.primary, borderColor: colors.primary }]}
                    keyboardType="decimal-pad"
                    value={finalPrice}
                    onChangeText={setFinalPrice}
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.adjustBtn,
                      { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : Colors.primaryContainer },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => adjustPrice(100)}
                  >
                    <Text style={[styles.adjustBtnText, { color: colors.primary }]}>+ ₹100</Text>
                  </Pressable>
                </View>
              </View>

              <Button
                title={publishing ? 'Publishing Listing...' : 'Publish Listing to Marketplace'}
                onPress={handlePublish}
                variant="primary"
                disabled={publishing}
                style={styles.publishBtn}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 6,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  craftLevelSection: {
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
    textAlign: 'center',
  },
  aiOutputBox: {
    backgroundColor: 'rgba(0, 97, 149, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 97, 149, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  outcomeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeHigh: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  badgeMedium: {
    backgroundColor: 'rgba(0, 97, 149, 0.1)',
  },
  badgeCost: {
    backgroundColor: 'rgba(230, 81, 0, 0.1)',
  },
  badgeTextHigh: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  badgeTextMedium: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  badgeTextCost: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
  },
  sourceDescText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  suggestedValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: Spacing.xs,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  explainCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  explainTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    gap: 6,
  },
  bulletCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  loadingBox: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  applyBtn: {
    height: 36,
    width: '85%',
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  finalSection: {
    marginVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  finalHeaderRow: {
    marginBottom: Spacing.xs,
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  finalSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  priceAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  adjustBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  finalInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.background,
    textAlign: 'center',
  },
  publishBtn: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
});
