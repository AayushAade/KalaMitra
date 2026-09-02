import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { products } = useProductCatalog();

  // Fetch product detail or fallback to first product
  const product = products.find(p => p.id === productId) || products[0];

  const handleInquire = () => {
    router.push({
      pathname: '/(buyer)/inquiry',
      params: { productId: product.id }
    } as any);
  };

  const handleViewSeller = () => {
    router.push({
      pathname: '/(buyer)/seller',
      params: {
        artisanId: product.artisanId || '',
        artisanName: product.artisanName || 'Artisan Store',
      },
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Product Details" />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
        {/* Large Product Image */}
        {product.imageUrl && (
          <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight, borderBottomColor: colors.borderLight }]}>
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={[styles.category, { color: colors.primary }]}>{product.craft || 'Handcrafted Heritage'}</Text>
          <Text style={[styles.name, { color: colors.onBackground }]}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            {product.price && (
              <Text style={[styles.price, { color: colors.primary }]}>
                ₹{product.price.toLocaleString('en-IN')}
              </Text>
            )}
            <View style={[styles.badge, isDarkMode && { backgroundColor: 'rgba(29,114,184,0.15)', borderColor: 'rgba(29,114,184,0.3)' }]}>
              <Text style={[styles.badgeText, isDarkMode && { color: colors.primary }]}>In Stock</Text>
            </View>
          </View>

          {/* Details list */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Material:</Text>
            <Text style={[styles.detailVal, { color: colors.onBackground }]}>{product.material || 'Natural Materials'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Craft Type:</Text>
            <Text style={[styles.detailVal, { color: colors.onBackground }]}>{product.craft || 'Traditional Handcraft'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Production Time:</Text>
            <Text style={[styles.detailVal, { color: colors.onBackground }]}>{product.productionTime || '3–5 days'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Min Order Qty:</Text>
            <Text style={[styles.detailVal, { color: colors.onBackground }]}>{product.minOrderQuantity || 1} units</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <Text style={[styles.descriptionTitle, { color: colors.onBackground }]}>Product Story & Description</Text>
          <Text style={[styles.descriptionText, { color: colors.textMuted }]}>
            {product.descriptionEnglish || product.descriptionHindi || 'Authentic handcrafted heritage creation made with traditional artisan expertise.'}
          </Text>

          {/* Seller details card */}
          <Pressable
            style={({ pressed }) => [
              styles.pressCard,
              { backgroundColor: colors.card, borderColor: colors.borderLight },
              pressed && styles.pressed,
            ]}
            onPress={handleViewSeller}
          >
            <View style={styles.sellerCard}>
              <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.sellerText, { color: colors.onPrimary }]}>{(product.artisanName || 'A').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={[styles.sellerTitle, { color: colors.onBackground }]}>{product.artisanName || 'Artisan Store'}</Text>
                <Text style={[styles.sellerSub, { color: colors.textMuted }]}>Verified Artisan Seller</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDarkMode ? colors.primary : colors.border} />
            </View>
          </Pressable>

          <Button
            title="Inquire about bulk order"
            onPress={handleInquire}
            variant="primary"
            style={styles.actionBtn}
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
    paddingBottom: Spacing.xl,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoCard: {
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.md,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.tertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  badge: {
    backgroundColor: 'rgba(0,180,100,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 11,
    color: 'rgb(0,140,80)',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    color: Colors.onBackground,
    fontWeight: '700',
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.secondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  pressCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sellerText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textLight,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  sellerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    width: '100%',
  },
});
