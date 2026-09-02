import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import SkeletonCard from '../../components/SkeletonCard';
import { Ionicons } from '@expo/vector-icons';
import { artisanService } from '../../services/artisanService';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';

export default function ArtisanHome() {
  const { colors, isDarkMode } = useTheme();
  const [artisan, setArtisan] = useState(artisanService.getCurrentArtisan());
  const { myProducts, inquiries, refreshProducts, refreshMyProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenuProductId, setActiveMenuProductId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((updated) => {
      setArtisan(updated);
      const currentUserId = updated?.id || artisanService.getAuthenticatedUser()?.id;
      if (currentUserId) {
        refreshMyProducts();
      }
    });
    setArtisan(artisanService.getCurrentArtisan());
    refreshProducts();
    refreshMyProducts();
    return unsubscribe;
  }, [refreshProducts, refreshMyProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProducts(), refreshMyProducts()]);
    setRefreshing(false);
  }, [refreshProducts, refreshMyProducts]);

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'add':
        router.push('/(artisan)/add-product' as any);
        break;
      case 'chat':
        router.push('/(artisan)/chat' as any);
        break;
      case 'profile':
        router.push('/(artisan)/profile' as any);
        break;
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete this product?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

              if (error) {
                console.warn('[Dashboard] Supabase delete warning:', error.message);
              }
              await refreshMyProducts();
              Alert.alert('Deleted', 'Product has been deleted successfully.');
            } catch (err: any) {
              console.error('[Dashboard] Error deleting product:', err);
              Alert.alert('Error', 'Unable to delete product. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Information Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.avatarCircle}>
            {artisan.avatar ? (
              <Image source={{ uri: artisan.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>
                {(artisan.ownerName || artisan.name || 'A').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={[styles.userName, { color: colors.onBackground }]} numberOfLines={1}>
              {artisan.ownerName || artisan.name}
            </Text>
            <Text style={[styles.shopName, { color: isDarkMode ? colors.tertiary : '#6E5D53' }]} numberOfLines={1}>
              {artisan.name}
            </Text>
            {artisan.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.location, { color: colors.textMuted }]}>{artisan.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => router.push('/(artisan)/artisan-catalogue' as any)}
            style={({ pressed }) => [styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderLight }, pressed && styles.pressedCard]}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>{myProducts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Products</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(artisan)/inquiries' as any)}
            style={({ pressed }) => [styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderLight }, pressed && styles.pressedCard]}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>{inquiries.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Bulk Inquiries</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(artisan)/artisan-review' as any)}
            style={({ pressed }) => [styles.statBox, { backgroundColor: colors.card, borderColor: colors.borderLight }, pressed && styles.pressedCard]}
          >
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {Number(artisan.rating || 5.0).toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rating</Text>
          </Pressable>
        </View>

        {/* My Products Section - Moved up directly below stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>My Products</Text>
            <Pressable onPress={() => router.push('/(artisan)/artisan-catalogue' as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </Pressable>
          </View>

          {isLoading && myProducts.length === 0 ? (
            <View style={styles.loadingGrid}>
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
            </View>
          ) : myProducts.length === 0 ? (
            <Pressable
              onPress={() => router.push('/(artisan)/add-product' as any)}
              style={({ pressed }) => [
                styles.emptyProductsCard,
                { backgroundColor: colors.card, borderColor: colors.primary },
                pressed && styles.pressedCard,
              ]}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
              <Text style={[styles.emptyProductsText, { color: colors.textMuted }]}>
                No products yet. Tap to add your first product.
              </Text>
            </Pressable>
          ) : (
            <View style={styles.productsGrid}>
              {myProducts.slice(0, 4).map((product) => (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    styles.productGridCard,
                    { backgroundColor: colors.card, borderColor: colors.borderLight },
                    pressed && styles.pressedCard,
                  ]}
                  onPress={() => {
                    setActiveMenuProductId(null);
                    router.push({
                      pathname: '/(buyer)/product',
                      params: { productId: product.id },
                    } as any);
                  }}
                >
                  <View style={[styles.productImageContainer, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
                    {product.imageUrl ? (
                      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={28} color={colors.border} />
                      </View>
                    )}

                    {/* 3-Dot Menu Button at TOP-LEFT */}
                    <Pressable
                      style={styles.threeDotBtn}
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        setActiveMenuProductId(activeMenuProductId === product.id ? null : product.id);
                      }}
                      accessibilityLabel="Product options"
                      accessibilityRole="button"
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
                    </Pressable>

                    {/* 3-Dot Dropdown Menu */}
                    {activeMenuProductId === product.id && (
                      <View
                        style={[
                          styles.menuDropdown,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <Pressable
                          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                          onPress={(e) => {
                            e.stopPropagation();
                            setActiveMenuProductId(null);
                            router.push({
                              pathname: '/(artisan)/edit-product',
                              params: { productId: product.id },
                            } as any);
                          }}
                        >
                          <Ionicons name="create-outline" size={15} color={colors.primary} />
                          <Text style={[styles.menuItemText, { color: colors.onBackground }]}>Edit</Text>
                        </Pressable>

                        <View style={[styles.menuDivider, { backgroundColor: colors.borderLight }]} />

                        <Pressable
                          style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                          onPress={(e) => {
                            e.stopPropagation();
                            setActiveMenuProductId(null);
                            handleDeleteProduct(product);
                          }}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.error} />
                          <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Status Badge at TOP-RIGHT */}
                    <View style={[
                      styles.statusBadge,
                      product.isPublished !== false
                        ? (isDarkMode ? { backgroundColor: 'rgba(29,114,184,0.2)' } : styles.badgePublished)
                        : styles.badgeDraft,
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        product.isPublished !== false
                          ? (isDarkMode ? { color: colors.primary } : styles.badgeTextPublished)
                          : styles.badgeTextDraft,
                      ]}>
                        {product.isPublished !== false ? 'Published' : 'Draft'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.onBackground }]} numberOfLines={2}>
                      {product.name}
                    </Text>
                    {product.price !== undefined && (
                      <Text style={[styles.productPrice, { color: colors.primary }]}>
                        ₹{product.price.toLocaleString('en-IN')}
                      </Text>
                    )}
                    {product.craft || product.material ? (
                      <Text style={[styles.productMaterial, { color: colors.textMuted }]} numberOfLines={1}>
                        {product.craft || product.material}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Marketplace Link */}
        <Pressable
          onPress={() => router.push('/(buyer)/marketplace' as any)}
          style={({ pressed }) => [
            styles.marketplaceBanner,
            {
              backgroundColor: isDarkMode ? '#162230' : 'rgba(0,97,149,0.06)',
              borderColor: isDarkMode ? colors.borderLight : 'rgba(0,97,149,0.15)',
            },
            pressed && styles.pressedCard,
          ]}
        >
          <View style={styles.marketplaceLeft}>
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
            <View style={{ marginLeft: Spacing.md }}>
              <Text style={[styles.marketplaceTitle, { color: colors.onBackground }]}>Marketplace</Text>
              <Text style={[styles.marketplaceSub, { color: colors.textMuted }]}>Explore crafts from all artisans</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </Pressable>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <BottomNavigation role="artisan" active="home" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: { paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.sm },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarLetter: { fontSize: 24, fontWeight: '800', color: Colors.textLight },
  profileTextContainer: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: Colors.onBackground },
  shopName: { fontSize: 13, color: '#6E5D53', fontWeight: '600', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { fontSize: 12, color: Colors.textMuted },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statNumber: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },

  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.onBackground },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  emptyProductsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryContainer,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyProductsText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  loadingGrid: {
    gap: Spacing.sm,
  },
  productGridCard: {
    width: '48.5%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  productImageContainer: {
    height: 130,
    backgroundColor: Colors.borderLight,
    position: 'relative',
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threeDotBtn: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuDropdown: {
    position: 'absolute',
    top: 36,
    left: Spacing.xs,
    width: 95,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 20,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    width: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgePublished: {
    backgroundColor: 'rgba(0,140,80,0.85)',
  },
  badgeDraft: {
    backgroundColor: 'rgba(100,100,100,0.85)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  badgeTextPublished: {
    color: '#FFF',
  },
  badgeTextDraft: {
    color: '#FFF',
  },
  productInfo: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 2,
    height: 34,
    lineHeight: 17,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  productMaterial: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  marketplaceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,97,149,0.06)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,97,149,0.15)',
    marginBottom: Spacing.sm,
  },
  marketplaceLeft: { flexDirection: 'row', alignItems: 'center' },
  marketplaceTitle: { fontSize: 15, fontWeight: '700', color: Colors.tertiary },
  marketplaceSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  pressedCard: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
