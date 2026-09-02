import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface SkeletonCardProps {
  height?: number;
  style?: object;
}

export default function SkeletonCard({ height = 220, style }: SkeletonCardProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <Animated.View style={[styles.card, { height, opacity }, style]}>
      <View style={styles.imageBlock} />
      <View style={styles.body}>
        <View style={[styles.line, { width: '70%' }]} />
        <View style={[styles.line, { width: '45%', marginTop: 8 }]} />
        <View style={[styles.lineShort, { marginTop: 12 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imageBlock: {
    height: 140,
    backgroundColor: Colors.borderLight,
  },
  body: {
    padding: Spacing.md,
  },
  line: {
    height: 14,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.xs,
  },
  lineShort: {
    width: '30%',
    height: 12,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.xs,
  },
});
