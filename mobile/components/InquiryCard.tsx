import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Inquiry } from '../types';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface InquiryCardProps {
  inquiry: Inquiry;
  onPress?: () => void;
}

export default function InquiryCard({ inquiry, onPress }: InquiryCardProps) {
  const isNew = inquiry.status === 'New';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.buyerName}>{inquiry.buyerName}</Text>
        <View style={[styles.badge, isNew ? styles.newBadge : styles.repliedBadge]}>
          <Text style={[styles.badgeText, isNew ? styles.newBadgeText : styles.repliedBadgeText]}>
            {inquiry.status}
          </Text>
        </View>
      </View>

      <Text style={styles.productTitle}>
        Product: <Text style={styles.productHighlight}>{inquiry.productTitle}</Text>
      </Text>

      {inquiry.quantity && (
        <Text style={styles.details}>
          Quantity: <Text style={styles.detailsHighlight}>{inquiry.quantity} units</Text>
        </Text>
      )}

      <Text style={styles.message} numberOfLines={2}>
        &quot;{inquiry.message}&quot;
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{inquiry.date}</Text>
        <Text style={styles.actionText}>Tap to Chat →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  newBadge: {
    backgroundColor: Colors.primaryContainer,
  },
  repliedBadge: {
    backgroundColor: Colors.borderLight,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  newBadgeText: {
    color: Colors.textLight,
  },
  repliedBadgeText: {
    color: Colors.secondary,
  },
  productTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  productHighlight: {
    fontWeight: '600',
    color: Colors.onBackground,
  },
  details: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  detailsHighlight: {
    fontWeight: '600',
    color: Colors.tertiary,
  },
  message: {
    fontSize: 13,
    color: Colors.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    paddingTop: Spacing.sm,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
