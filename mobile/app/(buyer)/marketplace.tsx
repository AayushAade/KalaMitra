import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import ProductCard from '../../components/ProductCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';

export default function MarketplaceScreen() {
  const { products } = useProductCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Textiles', 'Bamboo Craft', 'Pottery', 'Handicraft'];

  const getProductCategory = (p: Product) => {
    const name = (p.name || '').toLowerCase();
    const mat = (p.material || '').toLowerCase();
    if (name.includes('silk') || name.includes('dupatta') || mat.includes('silk') || mat.includes('cotton') || mat.includes('fabric')) {
      return 'Textiles';
    }
    if (name.includes('bamboo') || mat.includes('bamboo')) {
      return 'Bamboo Craft';
    }
    if (name.includes('pottery') || name.includes('diya') || name.includes('vase') || mat.includes('clay') || mat.includes('terracotta')) {
      return 'Pottery';
    }
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

  const handleProductPress = (id: string) => {
    router.push({
      pathname: '/(buyer)/product',
      params: { productId: id }
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} />
      
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
          />
        </View>
      </View>

      {/* Category Horizontal Filter Strip */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryTab,
                  isSelected && styles.categoryTabActive
                ]}
              >
                <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
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
              Discover handmade treasures direct from Pune heritage workshops.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Button
            title="Switch to Artisan View"
            onPress={() => router.replace('/')}
            variant="secondary"
            style={styles.switchButton}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No products match your search filters.</Text>
            <Button
              title="Reset Search Filters"
              onPress={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              variant="secondary"
              style={styles.resetButton}
            />
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
  searchSection: {
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
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
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.onBackground,
  },
  categorySection: {
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background,
    marginBottom: Spacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.marginMobile,
    gap: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  categoryTabTextActive: {
    color: Colors.textLight,
  },
  listContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl,
  },
  listHeader: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  switchButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  resetButton: {
    width: '60%',
  },
});
