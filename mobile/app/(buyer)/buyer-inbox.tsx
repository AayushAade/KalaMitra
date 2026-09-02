import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import EmptyState from '../../components/EmptyState';
import InquiryCard from '../../components/InquiryCard';
import SkeletonCard from '../../components/SkeletonCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';

export default function BuyerInboxScreen() {
  const { colors } = useTheme();
  const { inquiries, refreshProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        router.replace('/(buyer)/buyer-home' as any);
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'inbox':
        break;
      case 'profile':
        router.push('/(buyer)/buyer-profile' as any);
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Inbox" />

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
              onPress={() => router.push(`/chat/${item.id}` as any)}
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
              <Text style={[styles.title, { color: colors.onBackground }]}>My Messages</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Conversations with artisans</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              message="Contact artisans from product pages to start a conversation."
              actionLabel="Browse Marketplace"
              onAction={() => router.push('/(buyer)/marketplace' as any)}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavigation role="buyer" active="inbox" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md },
  listContent: { paddingHorizontal: Spacing.marginMobile, paddingBottom: Spacing.xl },
  listHeader: { paddingVertical: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.onBackground },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
});
