import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import DeleteProductDialog from '../../components/DeleteProductDialog';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { Ionicons } from '@expo/vector-icons';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';

export default function ArtisanCatalogueScreen() {
  const { colors, isDarkMode } = useTheme();
  const { myProducts, refreshMyProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMyProducts();
    setRefreshing(false);
  }, [refreshMyProducts]);

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        router.replace('/(artisan)/dashboard' as any);
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

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // Call Supabase delete using product.id (never by index)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh to reflect removal
      await refreshMyProducts();
      setDeleteTarget(null);
      showToast('Product deleted successfully.', false);
    } catch {
      setDeleteTarget(null);
      showToast('Unable to delete product. Please try again.', true);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      {/* Image */}
      <View style={[styles.productImageContainer, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.border} />
          </View>
        )}
        <View style={[
          styles.statusBadge,
          item.isPublished !== false ? (isDarkMode ? { backgroundColor: 'rgba(29,114,184,0.2)' } : styles.badgePublished) : styles.badgeDraft
        ]}>
          <Text style={[
            styles.statusBadgeText,
            item.isPublished !== false ? (isDarkMode ? { color: colors.primary } : styles.badgeTextPublished) : styles.badgeTextDraft
          ]}>
            {item.isPublished !== false ? 'Published' : 'Draft'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.onBackground }]} numberOfLines={2}>{item.name}</Text>
        {item.price !== undefined && (
          <Text style={[styles.productPrice, { color: colors.primary }]}>₹{item.price.toLocaleString('en-IN')}</Text>
        )}
        {item.material && (
          <Text style={[styles.productMaterial, { color: colors.textMuted }]} numberOfLines={1}>{item.material}</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.08)', borderColor: isDarkMode ? 'rgba(29,114,184,0.3)' : 'rgba(0,97,149,0.2)' },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push({
            pathname: '/(artisan)/edit-product',
            params: { productId: item.id }
          } as any)}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          onPress={() => setDeleteTarget(item)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  const ListHeader = () => {
    if (myProducts.length === 0) return null;
    return (
      <View style={styles.listHeader}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.groupTitle, { color: colors.onBackground }]}>My Catalog ({myProducts.length})</Text>
        </View>
      </View>
    );
  };

  const ListFooter = () => (
    <View style={{ height: Spacing.xl }} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Artisan Catalogue" />

      {/* Toast Notification */}
      {toast && (
        <View style={[styles.toast, toast.isError ? styles.toastError : styles.toastSuccess]}>
          <Ionicons
            name={toast.isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={18}
            color={Colors.textLight}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={myProducts}
          keyExtractor={item => item.id}
          renderItem={renderProductCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            <EmptyState
              icon="albums-outline"
              title="No products yet"
              message="Create your first product and start building your digital catalogue."
              actionLabel="+ Add Product"
              onAction={() => router.push('/(artisan)/add-product' as any)}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        visible={!!deleteTarget}
        productName={deleteTarget?.name || ''}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <BottomNavigation role="artisan" active="home" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md },

  listContent: { paddingHorizontal: Spacing.marginMobile, paddingBottom: Spacing.xl },
  columnWrapper: { gap: Spacing.md, justifyContent: 'space-between' },
  listHeader: { paddingTop: Spacing.sm, paddingBottom: Spacing.xs },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgb(0,140,80)',
  },
  groupDotDraft: { backgroundColor: Colors.textMuted },
  groupTitle: { fontSize: 14, fontWeight: '700', color: Colors.onBackground },

  productCard: {
    flex: 1,
    maxWidth: '48.5%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  productImageContainer: {
    height: 135,
    backgroundColor: Colors.borderLight,
    position: 'relative',
    width: '100%',
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgePublished: { backgroundColor: 'rgba(0,180,100,0.92)' },
  badgeDraft: { backgroundColor: 'rgba(148,68,46,0.92)' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  badgeTextPublished: { color: '#fff' },
  badgeTextDraft: { color: '#fff' },

  productInfo: { padding: Spacing.sm, paddingBottom: 4 },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
    height: 34,
    lineHeight: 17,
  },
  productPrice: { fontSize: 14, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  productMaterial: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  actionRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingTop: 4,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0,97,149,0.08)',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,97,149,0.2)',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.errorContainer,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.2)',
  },
  editText: { fontSize: 11, fontWeight: '700', color: Colors.tertiary },
  deleteText: { fontSize: 11, fontWeight: '700', color: Colors.error },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginHorizontal: Spacing.marginMobile,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  toastSuccess: { backgroundColor: 'rgb(0,140,80)' },
  toastError: { backgroundColor: Colors.error },
  toastText: { fontSize: 13, fontWeight: '600', color: Colors.textLight, flex: 1 },
});
