import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import { Ionicons } from '@expo/vector-icons';
import { artisanService } from '../../services/artisanService';

export default function ArtisanReviewScreen() {
  const artisan = artisanService.getCurrentArtisan();

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        router.replace('/(artisan)/dashboard' as any);
        break;
      case 'products':
        router.push('/(artisan)/artisan-catalogue' as any);
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'inbox':
        router.push('/(artisan)/inquiries' as any);
        break;
      case 'profile':
        router.push('/(artisan)/profile' as any);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header showBack={true} title="Artisan Review" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Rating Summary */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Your Rating</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={36} color="#F59E0B" />
            <Text style={styles.ratingValue}>
              {Number(artisan.rating || 5.0).toFixed(1)}
            </Text>
          </View>
          <Text style={styles.noReviews}>
            {artisan.reviewsCount && artisan.reviewsCount > 0
              ? `⭐ Based on ${artisan.reviewsCount} customer reviews`
              : '⭐ Verified Artisan Quality Rating'}
          </Text>
          <Text style={styles.noReviewsHint}>
            Ratings update as verified buyers leave feedback on your products.
          </Text>
        </View>

        {/* Empty Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <View style={styles.emptyCard}>
            <Ionicons name="chatbox-outline" size={48} color={Colors.primaryContainer} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyMessage}>
              Your customer reviews will appear here once buyers provide feedback on your products.
            </Text>
          </View>
        </View>
      </ScrollView>
      <BottomNavigation role="artisan" active="home" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: { paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md, paddingBottom: Spacing.xl },

  ratingCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  noReviews: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  noReviewsHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyMessage: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
