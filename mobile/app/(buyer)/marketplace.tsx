import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';

export default function MarketplaceScreen() {
  const { products, refreshProducts, isLoading } = useProductCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['All', 'Textiles', 'Bamboo Craft', 'Pottery', 'Handicraft'];

  const getProductCategory = (p: Product) => {
    const name = (p.name || '').toLowerCase();
    const mat = (p.material || '').toLowerCase();
    if (name.includes('silk') || name.includes('dupatta') || mat.includes('silk') || mat.includes('cotton') || mat.includes('fabric')) return 'Textiles';
    if (name.includes('bamboo') || mat.includes('bamboo')) return 'Bamboo Craft';
    if (name.includes('pottery') || name.includes('diya') || name.includes('vase') || mat.includes('clay') || mat.includes('terracotta')) return 'Pottery';
    return 'Handicraft';
  };

  const filteredProducts = products.filter(product => {
    const category = getProductCategory(product);
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.material && product.material.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.artisanName && product.artisanName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleProductPress = (id: string) => {
    router.push({
      pathname: '/(buyer)/product',
      params: { productId: id }
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search silk, pottery, bamboo..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
              >
                <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.title}>Artisan Creations</Text>
              <Text style={styles.subtitle}>
                Discover handmade treasures direct from heritage workshops.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No products found"
              message="Try another search or category."
              actionLabel="Reset Filters"
              onAction={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md },

  searchSection: {
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: Spacing.touchTarget,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 15, color: Colors.onBackground },
  clearBtn: { padding: 4 },

  categorySection: { paddingVertical: Spacing.xs, marginBottom: Spacing.xs },
  categoryScroll: { paddingHorizontal: Spacing.marginMobile, gap: Spacing.sm },
  categoryTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryTabText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  categoryTabTextActive: { color: Colors.textLight },

  listContent: { paddingHorizontal: Spacing.marginMobile, paddingBottom: Spacing.xl },
  listHeader: { paddingVertical: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.onBackground },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
});
