import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { artisanService } from '../../services/artisanService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PublicStoreScreen() {
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
    <SafeAreaView style={styles.container}>
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
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Store Cover Banner */}
            <View style={styles.banner} />
            
            {/* Store Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.avatarContainer}>
                {artisan.avatar ? (
                  <Image source={{ uri: artisan.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{(artisan.ownerName || 'A').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.storeName}>{artisan.name}</Text>
              <Text style={styles.ownerText}>Owner: {artisan.ownerName}</Text>
              
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📍 {artisan.location}</Text>
                <Text style={styles.metaText}>⭐ {Number(artisan.rating || 5.0).toFixed(1)} (Verified)</Text>
              </View>

              <Text style={styles.bioText}>{artisan.bio}</Text>
              
              {artisan.craft && (
                <View style={styles.tagContainer}>
                  <Text style={styles.tag}>{artisan.craft}</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Product Catalog ({myProducts.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>No products in your catalog yet.</Text>
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
