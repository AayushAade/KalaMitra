import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Message, Review } from '../../types';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';
import { reviewService } from '../../services/reviewService';

export default function ChatScreen() {
  const { colors, isDarkMode } = useTheme();
  const { inquiryId } = useLocalSearchParams<{ inquiryId?: string }>();
  const { inquiries, messagesMap, addMessage } = useProductCatalog();

  const activeInquiryId = inquiryId || 'inq-1001';
  const inquiry = inquiries.find(i => i.id === activeInquiryId) || inquiries[0];

  const currentRole = authService.getRole() === 'artisan' ? 'Artisan' : 'Buyer';
  const [localMessages, setLocalMessages] = useState<Message[]>(messagesMap[activeInquiryId] || []);
  const [inputText, setInputText] = useState('');

  // Rating & Review State
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0); // 0 = unselected
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ratingEligibility, setRatingEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    artisanId?: string;
    artisanName?: string;
    existingReview?: Review | null;
  }>({ eligible: false });

  const loadEligibility = React.useCallback(async () => {
    if (activeInquiryId && currentRole === 'Buyer') {
      const elig = await reviewService.canRateInquiry(activeInquiryId);
      setRatingEligibility(elig);
    }
  }, [activeInquiryId, currentRole]);

  // Fetch messages and rating eligibility from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (activeInquiryId) {
        const fetched = await chatService.fetchMessages(activeInquiryId);
        if (isMounted && fetched.length > 0) {
          setLocalMessages(fetched);
        }
        if (isMounted) {
          await loadEligibility();
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeInquiryId, loadEligibility]);

  const handleOpenRating = () => {
    setSelectedRating(0);
    setReviewText('');
    setIsRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (selectedRating < 1 || selectedRating > 5) {
      Alert.alert('Rating Required', 'Please tap a star to rate from 1 to 5 stars.');
      return;
    }

    if (!ratingEligibility.artisanId) {
      Alert.alert('Error', 'Artisan information could not be resolved.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewService.submitReview({
        artisanId: ratingEligibility.artisanId,
        inquiryId: activeInquiryId,
        rating: selectedRating,
        reviewText: reviewText.trim() || undefined,
      });

      setIsRatingModalVisible(false);
      Alert.alert(
        'Feedback Submitted',
        'Thank you for rating this artisan! Your feedback helps the artisan community grow.'
      );
      await loadEligibility();
    } catch (err: any) {
      console.error('[ChatScreen] Error submitting review:', err);
      Alert.alert('Submission Error', err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return '1 Star: Needs Improvement';
      case 2: return '2 Stars: Fair Quality';
      case 3: return '3 Stars: Good Quality';
      case 4: return '4 Stars: Great Craftsmanship';
      case 5: return '5 Stars: Masterful Craftsmanship & Service!';
      default: return 'Tap a star to rate';
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: currentRole,
      text: textToSend,
      time: 'Just Now',
    };

    setLocalMessages(prev => [...prev, newMsg]);
    addMessage(activeInquiryId, newMsg);

    try {
      await chatService.sendMessage(activeInquiryId, newMsg);
      const refreshed = await chatService.fetchMessages(activeInquiryId);
      if (refreshed.length > 0) {
        setLocalMessages(refreshed);
      }
    } catch (err) {
      console.warn('[ChatScreen] Error persisting message:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title={inquiry ? inquiry.buyerName : "Inquiry Chat"} />
      
      {/* Product Context Banner */}
      {inquiry && (
        <View style={[styles.productBanner, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
          <Ionicons name="cart-outline" size={20} color={colors.primary} style={styles.bannerIcon} />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: colors.onBackground }]} numberOfLines={1}>{inquiry.productTitle}</Text>
            <Text style={[styles.bannerPrice, { color: colors.primary }]}>₹{inquiry.productPrice.toLocaleString('en-IN')}</Text>
          </View>

          {/* Rate Artisan Button for Eligible Buyer */}
          {currentRole === 'Buyer' && ratingEligibility.eligible && (
            <Pressable
              onPress={handleOpenRating}
              style={[styles.rateButton, { backgroundColor: '#F59E0B' }]}
            >
              <Ionicons name="star" size={13} color="#FFFFFF" />
              <Text style={styles.rateButtonText}>Rate Artisan</Text>
            </Pressable>
          )}

          {currentRole === 'Buyer' && ratingEligibility.existingReview && (
            <View style={[styles.ratedBadge, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={[styles.ratedBadgeText, { color: '#B45309' }]}>
                Rated {ratingEligibility.existingReview.rating}★
              </Text>
            </View>
          )}

          <View style={[styles.bannerQty, { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.06)' }]}>
            <Text style={[styles.qtyLabel, { color: colors.primary }]}>QTY: {inquiry.quantity || 1}</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={localMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isMe = item.sender === currentRole;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMe
                    ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                    : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.borderLight }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMe ? [styles.textMe, { color: colors.onPrimary }] : [styles.textOther, { color: colors.onBackground }],
                  ]}
                >
                  {item.text}
                </Text>
                <Text
                  style={[
                    styles.timeText,
                    isMe ? styles.timeMe : [styles.timeOther, { color: colors.textMuted }],
                  ]}
                >
                  {item.time}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={[styles.chatContent, { backgroundColor: colors.background }]}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.borderLight }]}>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Interactive Rate Artisan Modal */}
      <Modal
        visible={isRatingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onBackground }]}>
                Rate Artisan
              </Text>
              <Pressable onPress={() => setIsRatingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              {ratingEligibility.artisanName || 'Artisan Store'} • {inquiry?.productTitle}
            </Text>

            {/* Interactive Stars */}
            <View style={styles.interactiveStarsContainer}>
              <View style={styles.interactiveStarsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Pressable
                    key={star}
                    onPress={() => setSelectedRating(star)}
                    style={styles.starHitBox}
                  >
                    <Ionicons
                      name={star <= selectedRating ? 'star' : 'star-outline'}
                      size={38}
                      color={star <= selectedRating ? '#F59E0B' : colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.starRatingLabel, { color: selectedRating > 0 ? '#D97706' : colors.textMuted }]}>
                {getRatingLabel(selectedRating)}
              </Text>
            </View>

            {/* Review Text Input */}
            <Text style={[styles.inputLabel, { color: colors.onBackground }]}>
              Written Review (Optional)
            </Text>
            <TextInput
              style={[
                styles.reviewTextInput,
                { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight },
              ]}
              placeholder="Describe product quality, responsiveness, packaging..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            <View style={styles.modalButtonsRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setIsRatingModalVisible(false)}
                style={styles.cancelBtn}
              />
              <Button
                title={isSubmittingReview ? 'Submitting...' : 'Submit Feedback'}
                variant="primary"
                onPress={handleSubmitRating}
                disabled={selectedRating === 0 || isSubmittingReview}
                loading={isSubmittingReview}
                style={styles.submitBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bannerIcon: {
    marginRight: Spacing.sm,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  bannerPrice: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerQty: {
    backgroundColor: 'rgba(0,97,149,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  qtyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  keyboardView: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMe: {
    color: Colors.textLight,
  },
  textOther: {
    color: Colors.onBackground,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeOther: {
    color: Colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    ...Shadows.soft,
  },
  rateButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  ratedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderTopWidth: 1,
    ...Shadows.soft,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  interactiveStarsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  starHitBox: {
    padding: 4,
  },
  starRatingLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  reviewTextInput: {
    height: 90,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});
