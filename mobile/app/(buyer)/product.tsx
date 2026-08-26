import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailsScreen() {
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
    router.push('/(buyer)/seller' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="Product Details" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Large Product Image */}
        {product.imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.category}>Traditional Handloom</Text>
          <Text style={styles.name}>{product.name}</Text>
          
          <View style={styles.priceRow}>
            {product.price && (
              <Text style={styles.price}>
                ₹{product.price.toLocaleString('en-IN')}
              </Text>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>In Stock</Text>
            </View>
          </View>

          {/* Details list */}
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Material:</Text>
            <Text style={styles.detailVal}>{product.material || 'Natural Materials'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Craft Type:</Text>
            <Text style={styles.detailVal}>Traditional Handloom</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Production Time:</Text>
            <Text style={styles.detailVal}>5 days</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Min Bulk Order:</Text>
            <Text style={styles.detailVal}>10 units</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.descriptionTitle}>Product Description</Text>
          <Text style={styles.descriptionText}>
            This product is crafted masterfully by skilled artisans in Maharashtra, showcasing intricate traditional handloom techniques. Durable, beautiful, and authentic.
          </Text>

          {/* Seller details card */}
          <Pressable
            style={({ pressed }) => [styles.pressCard, pressed && styles.pressed]}
            onPress={handleViewSeller}
          >
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerText}>S</Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerTitle}>{product.artisanName}</Text>
                <Text style={styles.sellerSub}>📍 Pune, Maharashtra • Verified Seller</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.border} />
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
