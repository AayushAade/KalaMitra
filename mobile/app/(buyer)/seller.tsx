import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Review } from '../../types';
import { reviewService } from '../../services/reviewService';
import { Ionicons } from '@expo/vector-icons';

export default function BuyerSellerProfileScreen() {
  const { colors, isDarkMode } = useTheme();
  const { artisanId, artisanName } = useLocalSearchParams<{ artisanId?: string; artisanName?: string }>();
  const { products } = useProductCatalog();
  const [reviews, setReviews] = useState<Review[]>([]);

  const sellerProducts = useMemo(() => {
    if (!artisanId && !artisanName) return products;
    return products.filter(
      p => (artisanId && p.artisanId === artisanId) || (artisanName && p.artisanName === artisanName)
    );
  }, [products, artisanId, artisanName]);

  const targetArtisanId = artisanId || sellerProducts[0]?.artisanId;
  const displayName = artisanName || sellerProducts[0]?.artisanName || 'Artisan Store';
  const displayCraft = sellerProducts[0]?.craft || 'Traditional Handcrafts';

  useEffect(() => {
    if (targetArtisanId) {
      reviewService.fetchArtisanReviews(targetArtisanId).then(setReviews);
    }
  }, [targetArtisanId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  const handleProductPress = (id: string) => {
    router.push({
      pathname: '/(buyer)/product',
      params: { productId: id },
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Artisan Profile" />
      <FlatList
        data={sellerProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item.id)}
          />
        )}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Store Cover Banner */}
            <View style={[styles.banner, { backgroundColor: isDarkMode ? '#1D3B5C' : colors.primaryContainer }]} />

            {/* Store Details Card */}
            <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              </View>

              <Text style={[styles.storeName, { color: colors.onBackground }]}>{displayName}</Text>
              <Text style={[styles.ownerText, { color: colors.textMuted }]}>Master Craftsperson Storefront</Text>

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>📍 Verified Heritage Craft</Text>
                <Text style={[styles.metaText, { color: colors.primary }]}>
                  {averageRating !== null
                    ? `⭐ ${averageRating.toFixed(1)} (${reviews.length} reviews)`
                    : '⭐ No ratings yet'}
                </Text>
              </View>

              <Text style={[styles.bioText, { color: colors.onBackground }]}>
                Authentic handcrafted creations made with traditional artisan methods and heritage skills.
              </Text>

              <View style={[styles.tagContainer, { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.08)', borderColor: isDarkMode ? 'rgba(29,114,184,0.3)' : 'rgba(0,97,149,0.2)' }]}>
                <Text style={[styles.tag, { color: colors.primary }]}>{displayCraft}</Text>
                <Text style={[styles.tag, { color: colors.primary }]}>Authentic Handcrafted</Text>
              </View>
            </View>

            {/* Customer Reviews Section */}
            {reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Customer Feedback ({reviews.length})</Text>
                {reviews.map(r => (
                  <View key={r.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewerName, { color: colors.onBackground }]}>{r.buyerName}</Text>
                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons
                            key={star}
                            name={star <= r.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    </View>
                    {r.reviewText ? (
                      <Text style={[styles.reviewBody, { color: colors.textMuted }]}>{r.reviewText}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Artisan Creations ({sellerProducts.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>No products listed by this artisan yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  headerSection: {
    paddingBottom: Spacing.md,
  },
  banner: {
    height: 100,
    backgroundColor: Colors.primaryContainer,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: -40,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    ...Shadows.soft,
  },
  avatarContainer: {
    marginBottom: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.card,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textLight,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    textAlign: 'center',
  },
  ownerText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  bioText: {
    fontSize: 13,
    color: Colors.onBackground,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onBackground,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  reviewsSection: {
    marginTop: Spacing.md,
  },
  reviewCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
