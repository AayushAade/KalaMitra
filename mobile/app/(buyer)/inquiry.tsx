import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuyerInquiryScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { products, addInquiry, addMessage } = useProductCatalog();

  const product = products.find(p => p.id === productId) || products[0];

  const [buyerName, setBuyerName] = useState('Raj Traders');
  const [buyerType, setBuyerType] = useState('Retail Distributor');
  const [qty, setQty] = useState('100');
  const [deliveryDate, setDeliveryDate] = useState('2026-09-20');
  const [msgText, setMsgText] = useState('Namaste! Interested in purchasing units. Please confirm bulk rates.');

  const handleSubmit = () => {
    const quantityVal = parseInt(qty) || 1;
    const newInquiryId = `inq-${Date.now()}`;

    const newInquiry = {
      id: newInquiryId,
      productId: product.id,
      productTitle: product.name,
      productPrice: product.price || 0,
      productImage: product.imageUrl,
      buyerName: buyerName,
      buyerType: buyerType,
      buyerLocation: 'Mumbai, Maharashtra',
      quantity: quantityVal,
      expectedDelivery: deliveryDate,
      message: msgText,
      status: 'New' as const,
      date: 'Today, Just Now'
    };

    // Save inquiry to global state
    addInquiry(newInquiry);

    // Register initial chat message
    addMessage(newInquiryId, {
      id: `msg-${Date.now()}`,
      sender: 'Buyer',
      text: msgText,
      time: 'Just Now'
    });

    alert('Inquiry sent successfully to the Artisan!');

    // Redirect to shared chat
    router.replace(`/chat/${newInquiryId}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="Send Inquiry" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Bulk Inquiry</Text>
            <Text style={styles.subtitle}>
              Submit inquiry for <Text style={styles.highlight}>{product.name}</Text>. The artisan will receive it on their dashboard.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Buyer Name / Store Name</Text>
                <TextInput
                  style={styles.input}
                  value={buyerName}
                  onChangeText={setBuyerName}
                  placeholder="e.g. Raj Traders"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Type</Text>
                <TextInput
                  style={styles.input}
                  value={buyerType}
                  onChangeText={setBuyerType}
                  placeholder="e.g. Boutique, Retail Distributor"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={qty}
                    onChangeText={setQty}
                    placeholder="100"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.label}>Delivery Date</Text>
                  <TextInput
                    style={styles.input}
                    value={deliveryDate}
                    onChangeText={setDeliveryDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Custom Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={msgText}
                  onChangeText={setMsgText}
                  placeholder="Describe your requirements"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Button
                title="Send Inquiry"
                onPress={handleSubmit}
                variant="primary"
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
