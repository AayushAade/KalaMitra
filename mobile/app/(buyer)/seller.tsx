import React, { useMemo } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuyerSellerProfileScreen() {
  const { artisanId, artisanName } = useLocalSearchParams<{ artisanId?: string; artisanName?: string }>();
  const { products } = useProductCatalog();

  const sellerProducts = useMemo(() => {
    if (!artisanId && !artisanName) return products;
    return products.filter(
      p => (artisanId && p.artisanId === artisanId) || (artisanName && p.artisanName === artisanName)
    );
  }, [products, artisanId, artisanName]);

  const displayName = artisanName || sellerProducts[0]?.artisanName || 'Artisan Store';
  const displayCraft = sellerProducts[0]?.craft || 'Traditional Handcrafts';

  const handleProductPress = (id: string) => {
    router.push({
      pathname: '/(buyer)/product',
      params: { productId: id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="Artisan Profile" />
      <FlatList
        data={sellerProducts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item.id)}
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
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.storeName}>{displayName}</Text>
              <Text style={styles.ownerText}>Master Craftsperson Storefront</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📍 Verified Heritage Craft</Text>
                <Text style={styles.metaText}>⭐ 5.0 Rating</Text>
              </View>

              <Text style={styles.bioText}>
                Authentic handcrafted creations made with traditional artisan methods and heritage skills.
              </Text>

              <View style={styles.tagContainer}>
                <Text style={styles.tag}>{displayCraft}</Text>
                <Text style={styles.tag}>Authentic Handcrafted</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Artisan Creations ({sellerProducts.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>No products listed by this artisan yet.</Text>
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
});
