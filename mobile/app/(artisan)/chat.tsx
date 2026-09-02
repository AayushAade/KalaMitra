import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';

export default function ArtisanChatScreen() {
  const { colors, isDarkMode } = useTheme();
  const { inquiries, messagesMap, refreshProducts, isLoading } = useProductCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleChatPress = (inquiryId: string) => {
    router.push(`/chat/${inquiryId}` as any);
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
        break;
      case 'profile':
        router.push('/(artisan)/profile' as any);
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Chat" />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={(item) => item.id}
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
              <Text style={[styles.title, { color: colors.onBackground }]}>Buyer Messages</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Real-time conversations with prospective buyers and craft enthusiasts.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const threadMessages = messagesMap[item.id] || [];
            const lastMsg = threadMessages[threadMessages.length - 1];
            const previewText = lastMsg ? lastMsg.text : item.message;

            return (
              <Pressable
                onPress={() => handleChatPress(item.id)}
                style={({ pressed }) => [
                  styles.chatCard,
                  { backgroundColor: colors.card, borderColor: colors.borderLight },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#1D72B8' : '#762D19' }]}>
                  <Text style={styles.avatarText}>
                    {(item.buyerName || 'B').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={[styles.buyerName, { color: colors.onBackground }]} numberOfLines={1}>
                      {item.buyerName}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {item.date || 'Active'}
                    </Text>
                  </View>

                  <Text style={[styles.productTag, { color: colors.primary }]} numberOfLines={1}>
                    Regarding: {item.productTitle}
                  </Text>

                  <Text style={[styles.messagePreview, { color: colors.textMuted }]} numberOfLines={1}>
                    {previewText}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.border} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No chats yet"
              message="When buyers message you about your crafts, conversations will appear here."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavigation role="artisan" active="chat" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl,
  },
  listHeader: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  productTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
