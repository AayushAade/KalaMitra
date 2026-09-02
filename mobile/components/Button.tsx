import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors, isDarkMode } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: colors.primary }
          : {
              backgroundColor: isDarkMode ? colors.card : colors.background,
              borderWidth: 1,
              borderColor: isDarkMode ? colors.border : colors.border,
            },
        disabled && {
          backgroundColor: isDarkMode ? '#222A36' : colors.borderLight,
          borderColor: isDarkMode ? '#222A36' : colors.borderLight,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary
              ? { color: colors.onPrimary }
              : { color: isDarkMode ? colors.onBackground : colors.primary },
            disabled && { color: isDarkMode ? '#6B7280' : colors.textMuted },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: Spacing.touchTarget,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.borderLight,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryText: {
    color: Colors.textLight,
  },
  secondaryText: {
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});
