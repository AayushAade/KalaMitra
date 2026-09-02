import React, { useState, useCallback } from 'react';
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
import { useProductCatalog } from '../../context/ProductCatalogContext';

export default function BuyerHomeScreen() {
  const { products, refreshProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'inbox':
        router.push('/(buyer)/buyer-inbox' as any);
        break;
      case 'profile':
        router.push('/(buyer)/buyer-profile' as any);
        break;
    }
  };

  const featuredProducts = products.slice(0, 4);

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
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>Discover Authentic{'\n'}Indian Handicrafts</Text>
          <Text style={styles.heroSub}>Sourced directly from skilled artisans</Text>
          <Pressable
            onPress={() => router.push('/(buyer)/marketplace' as any)}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <Text style={styles.heroButtonText}>Browse Marketplace</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
          </Pressable>
        </View>

        {/* Quick Links */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push('/(buyer)/marketplace' as any)}
            style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
          >
            <Ionicons name="storefront-outline" size={26} color={Colors.primary} />
            <Text style={styles.quickLabel}>Marketplace</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(buyer)/buyer-inbox' as any)}
            style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
          >
            <Ionicons name="chatbubbles-outline" size={26} color={Colors.primary} />
            <Text style={styles.quickLabel}>My Messages</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(buyer)/buyer-profile' as any)}
            style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
          >
            <Ionicons name="person-outline" size={26} color={Colors.primary} />
            <Text style={styles.quickLabel}>Profile</Text>
          </Pressable>
        </View>

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Crafts</Text>
          <Pressable onPress={() => router.push('/(buyer)/marketplace' as any)}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <>
            <SkeletonCard height={100} />
            <SkeletonCard height={100} />
          </>
        ) : (
          featuredProducts.map((product) => (
            <Pressable
              key={product.id}
              style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}
              onPress={() => router.push({
                pathname: '/(buyer)/product',
                params: { productId: product.id }
              } as any)}
            >
              <View style={styles.productThumb}>
                <Ionicons name="image-outline" size={22} color={Colors.border} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productArtisan} numberOfLines={1}>{product.artisanName}</Text>
                <Text style={styles.productPrice}>₹{product.price?.toLocaleString('en-IN')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.border} />
            </Pressable>
          ))
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <BottomNavigation role="buyer" active="home" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: { paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.sm },

  heroBanner: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textLight,
    lineHeight: 28,
    marginBottom: Spacing.xs,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  heroButtonText: { fontSize: 14, fontWeight: '700', color: Colors.textLight },

  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: Colors.onBackground, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.onBackground },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },

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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.onBackground },
  productArtisan: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  productPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 2 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
