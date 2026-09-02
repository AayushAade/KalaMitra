import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface DeleteProductDialogProps {
  visible: boolean;
  productName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteProductDialog({
  visible,
  productName,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteProductDialogProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={32} color={colors.error} />
          </View>

          <Text style={[styles.title, { color: colors.onBackground }]}>Delete Product?</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            Are you sure you want to delete{'\n'}
            <Text style={[styles.productName, { color: colors.onBackground }]}>{productName}</Text>?
          </Text>
          <Text style={styles.warning}>This action cannot be undone.</Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: isDarkMode ? '#222A36' : '#FAF6F2', borderColor: colors.borderLight },
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelText, { color: colors.onBackground }]}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
                isDeleting && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  dialog: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadows.soft,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  productName: {
    fontWeight: '700',
    color: Colors.onBackground,
  },
  warning: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textLight,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
