import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1A202A', '#12151A'] : ['#EFE5DE', '#FAF6F2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.header,
        {
          backgroundColor: isDarkMode ? '#1A202A' : '#EFE5DE',
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.actionSlot}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? colors.tertiary : colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.centerContainer}>
        {title ? (
          <Text style={[styles.titleText, { color: colors.onBackground }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.logoContainer}>
            <Text style={[styles.logoKala, isDarkMode && { color: '#E07A5F' }]}>कला</Text>
            <Text style={[styles.logoMitra, isDarkMode && { color: '#38BDF8' }]}>Mitra</Text>
          </View>
        )}
      </View>

      <View style={styles.actionSlot} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 68, 46, 0.12)',
  },
  actionSlot: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(148, 68, 46, 0.08)',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onBackground,
    textAlign: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  logoKala: {
    fontSize: 27,
    fontWeight: '900',
    color: '#94442E',
    letterSpacing: -0.3,
  },
  logoMitra: {
    fontSize: 27,
    fontWeight: '800',
    color: '#006195',
    letterSpacing: 0.4,
  },
});
