import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MyProductsScreen() {
  const { myProducts, refreshMyProducts, isLoading } = useProductCatalog();

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="My Catalog" />
      <FlatList
        data={myProducts}
        keyExtractor={item => item.id}
        refreshing={isLoading}
        onRefresh={refreshMyProducts}
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
          <View style={styles.listHeader}>
            <Text style={styles.title}>Manage Listings</Text>
            <Text style={styles.subtitle}>
              Monitor, edit, or check stock availability for your published products.
            </Text>
            <Button
              title="+ Add New Product"
              onPress={() => router.push('/(artisan)/add-product' as any)}
              variant="primary"
              style={styles.addButton}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>You haven&apos;t listed any crafts yet.</Text>
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
    marginBottom: Spacing.md,
  },
  addButton: {
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
  },
});
