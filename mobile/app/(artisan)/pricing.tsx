import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { pricingService } from '../../services/pricingService';
import { artisanService } from '../../services/artisanService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PricingScreen() {
  const { productData, resetProductData } = useProductCreation();
  const { addProduct } = useProductCatalog();

  const [matCost, setMatCost] = useState('600');
  const [labCost, setLabCost] = useState('400');
  const [othCost, setOthCost] = useState('150');

  // Calcs via pricingService
  const materialVal = parseFloat(matCost) || 0;
  const laborVal = parseFloat(labCost) || 0;
  const otherVal = parseFloat(othCost) || 0;

  const recommendation = pricingService.calculateRecommendation({
    materialCost: materialVal,
    laborCost: laborVal,
    otherCost: otherVal
  });

  const { totalCost, recommendedPrice, minPrice, maxPrice, explanation } = recommendation;

  const [finalPrice, setFinalPrice] = useState('1553');

  const [publishing, setPublishing] = useState(false);

  const applySuggested = () => {
    setFinalPrice(recommendedPrice.toString());
  };

  const handlePublish = async () => {
    const finalPriceVal = parseFloat(finalPrice) || recommendedPrice;
    setPublishing(true);

    try {
      // Build the complete product listing
      const newProduct = {
        name: productData.name || 'Handcrafted Product',
        imageUrl: productData.enhancedImage || productData.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud',
        originalImageUrl: productData.image,
        material: productData.material || 'Natural Materials',
        craft: productData.craft || 'Traditional Handicrafts',
        productionTime: productData.productionTime || '3 days',
        price: finalPriceVal,
        descriptionEnglish: productData.descriptionEnglish,
        descriptionHindi: productData.descriptionHindi,
        voiceTranscript: productData.voiceText,
        tags: productData.tags || [],
        artisanName: artisanService.getCurrentArtisan().name || artisanService.getCurrentArtisan().ownerName || 'My Store'
      };

      // Save listing into Supabase database & runtime state
      await addProduct(newProduct);

      // Reset creation wizard state
      resetProductData();

      alert('Product published successfully to the marketplace!');

      // Redirect to Products Listing view
      router.replace('/(artisan)/products' as any);
    } catch (err: any) {
      console.error('[PricingScreen] Failed to publish product:', err);
      alert(err.message || 'Failed to publish product to the marketplace. Please check your connection.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="AI Pricing Studio" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Wizard Progress */}
          <View style={styles.wizard}>
            <Text style={styles.wizardLabel}>Step 5 of 5: AI Pricing Assistant</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressIndicator, { width: '100%' }]} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Calculate Fair Value</Text>
            <Text style={styles.subtitle}>Enter your material and time inputs. AI calculates market rates.</Text>

            <View style={styles.card}>
              {/* Input Row */}
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Material Cost (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={matCost}
                    onChangeText={(val) => {
                      setMatCost(val);
                      const cost = (parseFloat(val) || 0) + laborVal + otherVal;
                      setFinalPrice(Math.round(cost * 1.35).toString());
                    }}
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Labor Cost (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={labCost}
                    onChangeText={(val) => {
                      setLabCost(val);
                      const cost = materialVal + (parseFloat(val) || 0) + otherVal;
                      setFinalPrice(Math.round(cost * 1.35).toString());
                    }}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Other Costs (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="decimal-pad"
                    value={othCost}
                    onChangeText={(val) => {
                      setOthCost(val);
                      const cost = materialVal + laborVal + (parseFloat(val) || 0);
                      setFinalPrice(Math.round(cost * 1.35).toString());
                    }}
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Total cost: ₹{totalCost}</Text>
                  <View style={styles.costBox} />
                </View>
              </View>

              {/* AI Outcome */}
              <View style={styles.aiOutputBox}>
                <Text style={styles.suggestedLabel}>💡 Recommended Price</Text>
                <Text style={styles.suggestedValue}>₹{recommendedPrice}</Text>
                <Text style={styles.rangeText}>
                  Acceptable Range: ₹{minPrice} - ₹{maxPrice}
                </Text>
                <Text style={styles.explanation}>
                  {explanation}
                </Text>
                <Button
                  title="Apply Recommendation"
                  onPress={applySuggested}
                  variant="secondary"
                  style={styles.applyBtn}
                />
              </View>

              {/* Final Listing Price */}
              <View style={styles.finalSection}>
                <Text style={styles.finalLabel}>Final Listing Price (₹)</Text>
                <TextInput
                  style={styles.finalInput}
                  keyboardType="decimal-pad"
                  value={finalPrice}
                  onChangeText={setFinalPrice}
                />
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
    marginBottom: 4,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  costBox: {
    justifyContent: 'center',
    height: 40,
  },
  aiOutputBox: {
    backgroundColor: 'rgba(0, 97, 149, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 97, 149, 0.12)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  suggestedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tertiary,
    marginBottom: 4,
    textAlign: 'center',
  },
  suggestedValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  explanation: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  applyBtn: {
    height: 36,
    width: '70%',
    alignSelf: 'center',
  },
  finalSection: {
    marginBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    paddingTop: Spacing.md,
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  finalInput: {
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.background,
  },
  publishBtn: {
    width: '100%',
  },
});
