import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { imageService } from '../../services/imageService';
import { productService } from '../../services/productService';
import { Product } from '../../types';

export default function EditProductScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { myProducts, products, updateProduct, refreshMyProducts } = useProductCatalog();

  // 1. Locate existing product
  const existingProduct: Product | undefined =
    myProducts.find(p => p.id === productId) ||
    products.find(p => p.id === productId) ||
    (productId ? productService.getProductById(productId) : undefined);

  // Form State
  const [name, setName] = useState('');
  const [craft, setCraft] = useState('');
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [minOrderQuantity, setMinOrderQuantity] = useState('1');
  const [productionTime, setProductionTime] = useState('');
  const [descriptionEnglish, setDescriptionEnglish] = useState('');
  const [descriptionHindi, setDescriptionHindi] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Status State
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);

  // Pre-fill existing product details
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setCraft(existingProduct.craft || '');
      setMaterial(existingProduct.material || '');
      setPrice(existingProduct.price !== undefined ? String(existingProduct.price) : '');
      setStock(existingProduct.stock !== undefined ? String(existingProduct.stock) : '1');
      setMinOrderQuantity(
        existingProduct.minOrderQuantity !== undefined ? String(existingProduct.minOrderQuantity) : '1'
      );
      setProductionTime(existingProduct.productionTime || '');
      setDescriptionEnglish(existingProduct.descriptionEnglish || '');
      setDescriptionHindi(existingProduct.descriptionHindi || '');
      setTags(existingProduct.tags ? existingProduct.tags.join(', ') : '');
      setImageUrl(existingProduct.imageUrl || null);
      setOriginalImageUrl(existingProduct.originalImageUrl || existingProduct.imageUrl || null);
    }
  }, [existingProduct]);

  // Image actions
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setImageUrl(pickedUri);
        setOriginalImageUrl(pickedUri);
        setIsEnhanced(false);
      }
    } catch (err: any) {
      console.error('[EditProduct] Gallery error:', err);
      Alert.alert('Gallery Error', 'Failed to pick image from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a new product photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setImageUrl(pickedUri);
        setOriginalImageUrl(pickedUri);
        setIsEnhanced(false);
      }
    } catch (err: any) {
      console.error('[EditProduct] Camera error:', err);
      Alert.alert('Camera Error', 'Failed to capture photo.');
    }
  };

  const handleEnhanceImage = async () => {
    if (!imageUrl) {
      Alert.alert('No Image', 'Please select an image before enhancing.');
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await imageService.enhanceImage(imageUrl);
      if (result.enhancedUrl) {
        setImageUrl(result.enhancedUrl);
        setIsEnhanced(true);
        Alert.alert('AI Studio Enhanced', 'Lighting, clarity, and artisan showcase background applied!');
      }
    } catch (err: any) {
      console.warn('[EditProduct] Enhancement fallback:', err);
      Alert.alert('Notice', 'AI Image Enhancement service busy. Using selected photo as-is.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Validation and saving
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product title.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price (e.g. 1200).');
      return;
    }

    const parsedStock = parseInt(stock, 10);
    const parsedMinOrder = parseInt(minOrderQuantity, 10);

    const targetId = existingProduct?.id || productId;
    if (!targetId) {
      Alert.alert('Error', 'Product ID missing. Cannot save changes.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const updates: Partial<Product> = {
        name: name.trim(),
        craft: craft.trim() || undefined,
        material: material.trim() || undefined,
        price: parsedPrice,
        stock: isNaN(parsedStock) ? 1 : parsedStock,
        minOrderQuantity: isNaN(parsedMinOrder) ? 1 : parsedMinOrder,
        productionTime: productionTime.trim() || undefined,
        descriptionEnglish: descriptionEnglish.trim() || undefined,
        descriptionHindi: descriptionHindi.trim() || undefined,
        tags: parsedTags,
        imageUrl: imageUrl || existingProduct?.imageUrl || undefined,
        originalImageUrl: originalImageUrl || existingProduct?.originalImageUrl || undefined,
      };

      await updateProduct(targetId, updates);
      await refreshMyProducts();

      Alert.alert('Success', 'Product updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error('[EditProduct] Save error:', err);
      Alert.alert('Save Error', err.message || 'Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Edit Product" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Image Section */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Product Image</Text>

            <View style={[styles.imagePreviewContainer, { backgroundColor: isDarkMode ? '#13171F' : '#F5EFEB', borderColor: colors.borderLight }]}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="image-outline" size={48} color={colors.border} />
                  <Text style={[styles.placeholderText, { color: colors.textMuted }]}>No image selected</Text>
                </View>
              )}

              {isEnhanced && (
                <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="sparkles" size={12} color={colors.onPrimary} />
                  <Text style={[styles.aiBadgeText, { color: colors.onPrimary }]}>AI Enhanced</Text>
                </View>
              )}
            </View>

            {/* Image Action Buttons */}
            <View style={styles.imageActionsRow}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.imageBtn,
                  { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.08)', borderColor: isDarkMode ? 'rgba(29,114,184,0.3)' : 'rgba(0,97,149,0.2)' },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="camera-outline" size={16} color={colors.primary} />
                <Text style={[styles.imageBtnText, { color: colors.primary }]}>Camera</Text>
              </Pressable>

              <Pressable
                onPress={handlePickFromGallery}
                style={({ pressed }) => [
                  styles.imageBtn,
                  { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.08)', borderColor: isDarkMode ? 'rgba(29,114,184,0.3)' : 'rgba(0,97,149,0.2)' },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="images-outline" size={16} color={colors.primary} />
                <Text style={[styles.imageBtnText, { color: colors.primary }]}>Gallery</Text>
              </Pressable>

              <Pressable
                onPress={handleEnhanceImage}
                disabled={isEnhancing || !imageUrl}
                style={({ pressed }) => [
                  styles.imageBtn,
                  styles.enhanceBtn,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                  (!imageUrl || isEnhancing) && { opacity: 0.6 },
                ]}
              >
                {isEnhancing ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color={colors.onPrimary} />
                    <Text style={[styles.imageBtnText, { color: colors.onPrimary }]}>AI Enhance</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Core Details Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Product Details</Text>

            {/* Title / Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onBackground }]}>
                Product Title <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Hand-painted Terracotta Pot"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Craft Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Craft Type / Category</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={craft}
                onChangeText={setCraft}
                placeholder="e.g. Pottery, Handloom, Woodcraft, Clay Craft"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Material */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Material</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={material}
                onChangeText={setMaterial}
                placeholder="e.g. Natural Terracotta Clay, Organic Cotton"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Price & Production Time Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={[styles.label, { color: colors.onBackground }]}>
                  Price (₹) <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="e.g. 1200"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Production Time</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={productionTime}
                  onChangeText={setProductionTime}
                  placeholder="e.g. 3-5 days"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Stock & MOQ Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Stock Available</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Min Order Qty</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={minOrderQuantity}
                  onChangeText={setMinOrderQuantity}
                  placeholder="e.g. 1"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Tags */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Search Tags (comma separated)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={tags}
                onChangeText={setTags}
                placeholder="e.g. terracotta, pot, heritage, gift"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Catalog Story / Bilingual Descriptions Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Product Story & Descriptions</Text>

            {/* English Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onBackground }]}>Description (English)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={descriptionEnglish}
                onChangeText={setDescriptionEnglish}
                placeholder="Describe your craft story, artisan technique, and heritage background in English..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Hindi Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onBackground }]}>विवरण (Hindi / Vernacular)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                value={descriptionHindi}
                onChangeText={setDescriptionHindi}
                placeholder="उत्पाद की हस्तकला, पारंपरिक निर्माण विधि और कहानी हिंदी में लिखें..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              loading={isSaving}
              style={styles.saveBtn}
            />

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: colors.borderLight },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>

          <View style={{ height: Spacing.xxl }} />
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.md,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  aiBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
  },
  imageActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  imageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 6,
  },
  enhanceBtn: {
    borderWidth: 0,
  },
  imageBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  actionsContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  saveBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
