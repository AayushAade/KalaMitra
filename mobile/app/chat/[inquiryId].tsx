import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types';
import { chatService } from '../../services/chatService';

export default function ChatScreen() {
  const { inquiryId } = useLocalSearchParams<{ inquiryId?: string }>();
  const { inquiries, messagesMap, addMessage } = useProductCatalog();

  const activeInquiryId = inquiryId || 'inq-1001';
  const inquiry = inquiries.find(i => i.id === activeInquiryId) || inquiries[0];

  // Retrieve message list from catalog context map
  const messages = messagesMap[activeInquiryId] || [];
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Send Buyer message (simulate role based on sender context or fallback to Buyer/Artisan toggle)
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'Buyer', // Mock sender
      text: inputText.trim(),
      time: 'Just Now'
    };

    addMessage(activeInquiryId, newMessage);
    setInputText('');

    // Simulate artisan auto-response after 1.5s to make it feel extremely responsive!
    setTimeout(() => {
      const autoReply = chatService.getSimulatedReply();
      addMessage(activeInquiryId, autoReply);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title={inquiry ? inquiry.buyerName : "Inquiry Chat"} />
      
      {/* Product Context Banner */}
      {inquiry && (
        <View style={styles.productBanner}>
          <Ionicons name="cart-outline" size={20} color={Colors.primary} style={styles.bannerIcon} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle} numberOfLines={1}>{inquiry.productTitle}</Text>
            <Text style={styles.bannerPrice}>₹{inquiry.productPrice.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.bannerQty}>
            <Text style={styles.qtyLabel}>QTY: {inquiry.quantity || 1}</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isMe = item.sender === 'Buyer';
            return (
              <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
                  {item.text}
                </Text>
                <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeOther]}>
                  {item.time}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={styles.chatContent}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <Pressable onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={20} color={Colors.textLight} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bannerIcon: {
    marginRight: Spacing.sm,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  bannerPrice: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerQty: {
    backgroundColor: 'rgba(0,97,149,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  qtyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiary,
  },
  keyboardView: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMe: {
    color: Colors.textLight,
  },
  textOther: {
    color: Colors.onBackground,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeOther: {
    color: Colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
