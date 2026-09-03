import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const { colors, isDarkMode } = useTheme();

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

  const category = getProductCategory(product);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.borderLight },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
        {product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? 'rgba(26,32,42,0.95)' : 'rgba(252,249,246,0.92)', borderColor: colors.borderLight }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{category}</Text>
        </View>
        {product.artisanRating !== null && product.artisanRating !== undefined && (product.artisanRatingCount || 0) > 0 && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {product.artisanRating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.onBackground }]} numberOfLines={2}>
          {product.name}
        </Text>
        {product.material ? (
          <Text style={[styles.material, { color: colors.textMuted }]} numberOfLines={1}>
            {product.material}
          </Text>
        ) : null}
        <View style={styles.footer}>
          {product.price !== undefined && (
            <Text style={[styles.price, { color: colors.primary }]}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
          )}
          {product.artisanName ? (
            <Text style={[styles.artisan, { color: isDarkMode ? colors.secondary : colors.secondary }]} numberOfLines={1}>
              {product.artisanName}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    maxWidth: '48.5%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 135,
    backgroundColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(252,249,246,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,97,149,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textLight,
  },
  info: {
    padding: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
    height: 34,
    lineHeight: 17,
    marginBottom: 2,
  },
  material: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  artisan: {
    fontSize: 11,
    color: Colors.secondary,
    maxWidth: '55%',
    textAlign: 'right',
  },
});
