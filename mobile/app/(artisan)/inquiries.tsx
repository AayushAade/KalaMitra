import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import InquiryCard from '../../components/InquiryCard';
import BottomNavigation from '../../components/BottomNavigation';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArtisanInquiriesScreen() {
  const { colors } = useTheme();
  const { inquiries, refreshProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleInquiryPress = (id: string) => {
    router.push(`/chat/${id}` as any);
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Bulk Inquiries" />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard height={100} />
          <SkeletonCard height={100} />
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <InquiryCard
              inquiry={item}
              onPress={() => handleInquiryPress(item.id)}
            />
          )}
          contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.title, { color: colors.onBackground }]}>Bulk Order Requests</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Incoming wholesale & customized craft requests from buyers.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="No bulk inquiries yet"
              message="When buyers submit wholesale or bulk order requests, they will appear here."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavigation role="artisan" active="home" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md },
  listContent: { paddingHorizontal: Spacing.marginMobile, paddingBottom: Spacing.xl },
  listHeader: { paddingVertical: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.onBackground },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
});
