import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { inquiryService } from '../../services/inquiryService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuyerInquiryScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { products, addInquiry, addMessage } = useProductCatalog();

  const product = products.find(p => p.id === productId) || products[0];

  const [buyerName, setBuyerName] = useState('Raj Traders');
  const [buyerType, setBuyerType] = useState('Retail Distributor');
  const [qty, setQty] = useState('100');
  const [deliveryDate, setDeliveryDate] = useState('2026-09-20');
  const [msgText, setMsgText] = useState('Namaste! Interested in purchasing units. Please confirm bulk rates.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const quantityVal = parseInt(qty) || 1;
    setIsSubmitting(true);

    try {
      const createdInquiry = await inquiryService.createInquiry({
        productId: product.id,
        productTitle: product.name,
        productPrice: product.price || 0,
        productImage: product.imageUrl,
        buyerName: buyerName.trim() || 'Verified Buyer',
        buyerType: buyerType.trim() || 'Retail Distributor',
        quantity: quantityVal,
        expectedDelivery: deliveryDate.trim() || undefined,
        message: msgText.trim(),
      });

      // Save inquiry to global state
      addInquiry(createdInquiry);

      // Register initial chat message
      addMessage(createdInquiry.id, {
        id: `msg-${Date.now()}`,
        sender: 'Buyer',
        text: msgText,
        time: 'Just Now',
      });

      // Redirect to shared chat
      router.replace(`/chat/${createdInquiry.id}` as any);
    } catch (err: any) {
      console.error('[BuyerInquiry] Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Send Inquiry" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.onBackground }]}>Bulk Inquiry</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Submit inquiry for <Text style={[styles.highlight, { color: colors.primary }]}>{product.name}</Text>. The artisan will receive it on their dashboard.
            </Text>

            <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Buyer Name / Store Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={buyerName}
                  onChangeText={setBuyerName}
                  placeholder="e.g. Raj Traders"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Business Type</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={buyerType}
                  onChangeText={setBuyerType}
                  placeholder="e.g. Boutique, Retail Distributor"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={[styles.label, { color: colors.onBackground }]}>Quantity</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                    value={qty}
                    onChangeText={setQty}
                    placeholder="100"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={[styles.label, { color: colors.onBackground }]}>Delivery Date</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                    value={deliveryDate}
                    onChangeText={setDeliveryDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Custom Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  value={msgText}
                  onChangeText={setMsgText}
                  placeholder="Describe your requirements"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Button
                title={isSubmitting ? 'Sending...' : 'Send Inquiry'}
                onPress={handleSubmit}
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                style={styles.submitBtn}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.marginMobile,
  },
  content: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  highlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputCol: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 80,
    paddingVertical: Spacing.sm,
    textAlignVertical: 'top',
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
