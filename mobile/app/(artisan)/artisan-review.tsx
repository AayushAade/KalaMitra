import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import { Ionicons } from '@expo/vector-icons';
import { artisanService } from '../../services/artisanService';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';

export default function ArtisanReviewScreen() {
  const { colors } = useTheme();
  const artisan = artisanService.getCurrentArtisan();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (artisan.id) {
      reviewService.fetchArtisanReviews(artisan.id).then(data => {
        setReviews(data);
      });
    }
  }, [artisan.id]);

  const hasRatings = artisan.rating !== null && artisan.rating !== undefined && (artisan.reviewsCount || 0) > 0;

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
      <Header showBack={true} title="Artisan Ratings & Reviews" />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Rating Summary */}
        <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.ratingTitle, { color: colors.textMuted }]}>Your Store Rating</Text>
          <View style={styles.ratingRow}>
            <Ionicons
              name={hasRatings ? 'star' : 'star-outline'}
              size={36}
              color={hasRatings ? '#F59E0B' : colors.textMuted}
            />
            <Text style={[styles.ratingValue, { color: colors.onBackground }]}>
              {hasRatings ? Number(artisan.rating).toFixed(1) : 'No Ratings'}
            </Text>
          </View>
          <Text style={[styles.noReviews, { color: colors.textMuted }]}>
            {hasRatings
              ? `⭐ Based on ${artisan.reviewsCount} customer review${artisan.reviewsCount === 1 ? '' : 's'}`
              : 'No customer reviews submitted yet'}
          </Text>
          <Text style={[styles.noReviewsHint, { color: colors.textMuted }]}>
            Ratings automatically calculate as verified buyers submit feedback on completed inquiries.
          </Text>
        </View>

        {/* Reviews List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Customer Reviews ({reviews.length})
          </Text>

          {reviews.length > 0 ? (
            reviews.map(r => (
              <View key={r.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text style={[styles.reviewerName, { color: colors.onBackground }]}>{r.buyerName}</Text>
                    <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Ionicons
                        key={star}
                        name={star <= r.rating ? 'star' : 'star-outline'}
                        size={16}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
                {r.reviewText ? (
                  <Text style={[styles.reviewBody, { color: colors.onBackground }]}>{r.reviewText}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Ionicons name="chatbox-outline" size={48} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No reviews yet</Text>
              <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
                Customer reviews and ratings will appear here once buyers leave feedback on their orders.
              </Text>
            </View>
          )}
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
  reviewCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
