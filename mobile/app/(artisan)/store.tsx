import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { artisanService } from '../../services/artisanService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicStoreScreen() {
  const { colors, isDarkMode } = useTheme();
  const [artisan, setArtisan] = useState(artisanService.getCurrentArtisan());
  const { myProducts } = useProductCatalog();

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((updated) => {
      setArtisan(updated);
    });
    setArtisan(artisanService.getCurrentArtisan());
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Storefront Preview" />
      <FlatList
        data={myProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push({
              pathname: '/(buyer)/product',
              params: { productId: item.id }
            } as any)}
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
                {artisan.avatar ? (
                  <Image source={{ uri: artisan.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{(artisan.ownerName || 'A').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.storeName, { color: colors.onBackground }]}>{artisan.name}</Text>
              <Text style={[styles.ownerText, { color: colors.textMuted }]}>Owner: {artisan.ownerName}</Text>
              
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>📍 {artisan.location}</Text>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {artisan.rating !== null && artisan.rating !== undefined && (artisan.reviewsCount || 0) > 0
                    ? `⭐ ${Number(artisan.rating).toFixed(1)} (${artisan.reviewsCount} reviews)`
                    : '⭐ No ratings yet'}
                </Text>
              </View>

              <Text style={[styles.bioText, { color: colors.onBackground }]}>{artisan.bio}</Text>
              
              {artisan.craft && (
                <View style={[styles.tagContainer, { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.08)', borderColor: isDarkMode ? 'rgba(29,114,184,0.3)' : 'rgba(0,97,149,0.2)' }]}>
                  <Text style={[styles.tag, { color: colors.primary }]}>{artisan.craft}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Product Catalog ({myProducts.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>No products in your catalog yet.</Text>
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
    marginHorizontal: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: Colors.card,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  avatarText: {
    fontSize: 32,
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
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  bioText: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiary,
    backgroundColor: 'rgba(0,97,149,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.sm,
  },
});
