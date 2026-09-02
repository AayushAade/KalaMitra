import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
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
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageContainer}>
        {product.imageUrl && (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ 4.9</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        {product.material && (
          <Text style={styles.material} numberOfLines={1}>
            {product.material}
          </Text>
        )}
        <View style={styles.footer}>
          {product.price !== undefined && (
            <Text style={styles.price}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
          )}
          {product.artisanName && (
            <Text style={styles.artisan} numberOfLines={1}>
              {product.artisanName}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
    height: 180,
    backgroundColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(252,249,246,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,97,149,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textLight,
  },
  info: {
    padding: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  material: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  artisan: {
    fontSize: 12,
    color: Colors.secondary,
    maxWidth: '60%',
    textAlign: 'right',
  },
});
