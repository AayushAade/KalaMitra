import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import SkeletonCard from '../../components/SkeletonCard';
import { Ionicons } from '@expo/vector-icons';
import { artisanService } from '../../services/artisanService';
import { useProductCatalog } from '../../context/ProductCatalogContext';

export default function ArtisanHome() {
  const [artisan, setArtisan] = useState(artisanService.getCurrentArtisan());
  const { myProducts, inquiries, refreshProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((updated) => {
      setArtisan(updated);
    });
    setArtisan(artisanService.getCurrentArtisan());
    refreshProducts();
    return unsubscribe;
  }, [refreshProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        break;
      case 'products':
        router.push('/(artisan)/artisan-catalogue' as any);
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'inbox':
        router.push('/(artisan)/inquiries' as any);
        break;
      case 'profile':
        router.push('/(artisan)/profile' as any);
        break;
    }
  };

  const publishedProducts = myProducts.filter(p => p.isPublished !== false);
  const recentProducts = publishedProducts.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Welcome Banner */}
        <Pressable
          onPress={() => router.push('/(artisan)/profile' as any)}
          style={({ pressed }) => [styles.welcomeCard, pressed && styles.pressedCard]}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(artisan.ownerName || artisan.name || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.namaste}>Namaste, {artisan.ownerName || artisan.name} 👋</Text>
            <Text style={styles.shopName} numberOfLines={1}>{artisan.name}</Text>
            {artisan.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.location}>{artisan.location}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.border} />
        </Pressable>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => router.push('/(artisan)/artisan-catalogue' as any)}
            style={({ pressed }) => [styles.statBox, pressed && styles.pressedCard]}
          >
            <Text style={styles.statNumber}>{myProducts.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(artisan)/inquiries' as any)}
            style={({ pressed }) => [styles.statBox, pressed && styles.pressedCard]}
          >
            <Text style={styles.statNumber}>{inquiries.length}</Text>
            <Text style={styles.statLabel}>Inquiries</Text>
          </Pressable>
          <View style={styles.statBox}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.statNumber}>
                {myProducts.length > 0 ? '4.8' : '—'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Action Tiles */}
        <View style={styles.quickGrid}>
          <Pressable
            onPress={() => router.push('/(artisan)/add-product' as any)}
            style={({ pressed }) => [styles.quickTile, styles.quickTilePrimary, pressed && styles.pressedCard]}
          >
            <Ionicons name="add-circle-outline" size={28} color={Colors.textLight} />
            <Text style={styles.quickTileTextLight}>Add Product</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(artisan)/artisan-catalogue' as any)}
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressedCard]}
          >
            <Ionicons name="albums-outline" size={28} color={Colors.primary} />
            <Text style={styles.quickTileText}>Artisan Catalogue</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(artisan)/artisan-review' as any)}
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressedCard]}
          >
            <Ionicons name="star-outline" size={28} color={Colors.primary} />
            <Text style={styles.quickTileText}>Artisan Review</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(artisan)/inquiries' as any)}
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressedCard]}
          >
            <Ionicons name="chatbubbles-outline" size={28} color={Colors.primary} />
            <Text style={styles.quickTileText}>Recent Messages</Text>
          </Pressable>
        </View>

        {/* My Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Products</Text>
            <Pressable onPress={() => router.push('/(artisan)/artisan-catalogue' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <>
              <SkeletonCard height={100} />
              <SkeletonCard height={100} />
            </>
          ) : recentProducts.length === 0 ? (
            <Pressable
              onPress={() => router.push('/(artisan)/add-product' as any)}
              style={({ pressed }) => [styles.emptyProductsCard, pressed && styles.pressedCard]}
            >
              <Ionicons name="add-circle-outline" size={32} color={Colors.primaryContainer} />
              <Text style={styles.emptyProductsText}>No products yet. Tap to add your first product.</Text>
            </Pressable>
          ) : (
            recentProducts.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [styles.productRow, pressed && styles.pressedCard]}
                onPress={() => router.push({
                  pathname: '/(buyer)/product',
                  params: { productId: product.id }
                } as any)}
              >
                <View style={styles.productThumb}>
                  <Ionicons name="image-outline" size={22} color={Colors.border} />
                </View>
                <View style={styles.productRowInfo}>
                  <Text style={styles.productRowName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productRowPrice}>
                    ₹{product.price?.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.statusPill, product.isPublished !== false ? styles.pillPublished : styles.pillDraft]}>
                  <Text style={[styles.statusText, product.isPublished !== false ? styles.statusPublished : styles.statusDraft]}>
                    {product.isPublished !== false ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Marketplace Link */}
        <Pressable
          onPress={() => router.push('/(buyer)/marketplace' as any)}
          style={({ pressed }) => [styles.marketplaceBanner, pressed && styles.pressedCard]}
        >
          <View style={styles.marketplaceLeft}>
            <Ionicons name="storefront-outline" size={24} color={Colors.tertiary} />
            <View style={{ marginLeft: Spacing.md }}>
              <Text style={styles.marketplaceTitle}>Marketplace</Text>
              <Text style={styles.marketplaceSub}>Explore crafts from all artisans</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color={Colors.tertiary} />
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

  welcomeCard: {
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
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: Colors.textLight },
  welcomeText: { flex: 1 },
  namaste: { fontSize: 15, fontWeight: '700', color: Colors.onBackground },
  shopName: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  location: { fontSize: 11, color: Colors.textMuted },

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

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickTile: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 90,
    ...Shadows.soft,
  },
  quickTilePrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  quickTileTextLight: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

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

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  productRowInfo: { flex: 1 },
  productRowName: { fontSize: 14, fontWeight: '700', color: Colors.onBackground },
  productRowPrice: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pillPublished: { backgroundColor: 'rgba(0,180,100,0.1)' },
  pillDraft: { backgroundColor: 'rgba(148,68,46,0.08)' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusPublished: { color: 'rgb(0,140,80)' },
  statusDraft: { color: Colors.primary },

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
