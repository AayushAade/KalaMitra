import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      {title ? (
        <Text style={styles.titleText}>{title}</Text>
      ) : (
        <View style={styles.logoContainer}>
          <Text style={styles.logoKala}>कला</Text>
          <Text style={styles.logoMitra}>Mitra</Text>
        </View>
      )}

      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoKala: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  logoMitra: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.secondary,
  },
});
