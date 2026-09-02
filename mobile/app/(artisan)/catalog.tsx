import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CatalogScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productData, updateProductData } = useProductCreation();

  const [titleEN, setTitleEN] = useState(productData.name || '');
  const [descEN, setDescEN] = useState(productData.descriptionEnglish || '');
  const [titleHI, setTitleHI] = useState(productData.name || ''); // Default to title
  const [descHI, setDescHI] = useState(productData.descriptionHindi || '');
  const [tagsInput, setTagsInput] = useState(productData.tags ? productData.tags.join(', ') : '');

  const handleNext = () => {
    updateProductData({
      name: titleEN,
      descriptionEnglish: descEN,
      descriptionHindi: descHI,
      tags: tagsInput.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      step: 5,
    });
    router.push('/(artisan)/pricing' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="AI Catalog Setup" />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
        {/* Wizard Progress */}
        <View style={[styles.wizard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.wizardLabel, { color: colors.primary }]}>Step 4 of 5: AI Catalog Preview</Text>
          <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
            <View style={[styles.progressIndicator, { width: '80%', backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.onBackground }]}>Confirm Catalog Story</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>AI drafted professional listings in English & Hindi. Review and adjust below.</Text>

          {/* Product Image preview */}
          {productData.enhancedImage && (
            <View style={[styles.imageBox, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
              <Image source={{ uri: productData.enhancedImage }} style={styles.image} />
            </View>
          )}

          {/* AI Extracted Craft Specs */}
          {(productData.material || productData.craft || productData.productionTime) && (
            <View style={[styles.specsCard, { backgroundColor: isDarkMode ? '#172230' : '#EBF5FB', borderColor: isDarkMode ? colors.borderLight : '#D4E6F1' }]}>
              <View style={styles.specsHeader}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.specsTitle, { color: colors.primary }]}>AI Detected Craft Attributes</Text>
              </View>
              <View style={styles.specsGrid}>
                {productData.material && (
                  <View style={[styles.specChip, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <Text style={[styles.specLabel, { color: colors.textMuted }]}>Material:</Text>
                    <Text style={[styles.specVal, { color: colors.onBackground }]}>{productData.material}</Text>
                  </View>
                )}
                {productData.craft && (
                  <View style={[styles.specChip, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <Text style={[styles.specLabel, { color: colors.textMuted }]}>Craft:</Text>
                    <Text style={[styles.specVal, { color: colors.onBackground }]}>{productData.craft}</Text>
                  </View>
                )}
                {productData.productionTime && (
                  <View style={[styles.specChip, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <Text style={[styles.specLabel, { color: colors.textMuted }]}>Production Time:</Text>
                    <Text style={[styles.specVal, { color: colors.onBackground }]}>{productData.productionTime}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            {/* English Catalog details */}
            <Text style={[styles.langHeader, { color: colors.onBackground }]}>🇬🇧 English Listing</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Product Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={titleEN}
                onChangeText={setTitleEN}
                placeholder="Product title in English"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={descEN}
                onChangeText={setDescEN}
                placeholder="Describe your craft story in English"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Hindi Catalog details */}
            <Text style={[styles.langHeader, { color: colors.onBackground }]}>🇮🇳 हिंदी विवरण (Hindi)</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.onBackground }]}>उत्पाद का नाम (Title)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={titleHI}
                onChangeText={setTitleHI}
                placeholder="Product title in Hindi"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.onBackground }]}>विवरण (Description)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={descHI}
                onChangeText={setDescHI}
                placeholder="विवरण हिंदी में दर्ज करें"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Tags/Keywords */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Keywords / Tags (comma separated)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={tagsInput}
                onChangeText={setTagsInput}
                placeholder="silk, saree, handloom, zari"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Button
              title="Continue to Fair Pricing"
              onPress={handleNext}
              variant="primary"
              style={styles.nextButton}
            />
          </View>
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
  imageBox: {
    height: 160,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  langHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
    paddingBottom: 4,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 90,
    paddingVertical: Spacing.sm,
    textAlignVertical: 'top',
  },
  specsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  specsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  specVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  nextButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
