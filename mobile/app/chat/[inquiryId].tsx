import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/authService';

export default function ChatScreen() {
  const { colors, isDarkMode } = useTheme();
  const { inquiryId } = useLocalSearchParams<{ inquiryId?: string }>();
  const { inquiries, messagesMap, addMessage } = useProductCatalog();

  const activeInquiryId = inquiryId || 'inq-1001';
  const inquiry = inquiries.find(i => i.id === activeInquiryId) || inquiries[0];

  const currentRole = authService.getRole() === 'artisan' ? 'Artisan' : 'Buyer';
  const [localMessages, setLocalMessages] = useState<Message[]>(messagesMap[activeInquiryId] || []);
  const [inputText, setInputText] = useState('');

  // Fetch messages from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const loadMessages = async () => {
      if (activeInquiryId) {
        const fetched = await chatService.fetchMessages(activeInquiryId);
        if (isMounted && fetched.length > 0) {
          setLocalMessages(fetched);
        }
      }
    };
    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [activeInquiryId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: currentRole,
      text: textToSend,
      time: 'Just Now',
    };

    setLocalMessages(prev => [...prev, newMsg]);
    addMessage(activeInquiryId, newMsg);

    try {
      await chatService.sendMessage(activeInquiryId, newMsg);
      const refreshed = await chatService.fetchMessages(activeInquiryId);
      if (refreshed.length > 0) {
        setLocalMessages(refreshed);
      }
    } catch (err) {
      console.warn('[ChatScreen] Error persisting message:', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title={inquiry ? inquiry.buyerName : "Inquiry Chat"} />
      
      {/* Product Context Banner */}
      {inquiry && (
        <View style={[styles.productBanner, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
          <Ionicons name="cart-outline" size={20} color={colors.primary} style={styles.bannerIcon} />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: colors.onBackground }]} numberOfLines={1}>{inquiry.productTitle}</Text>
            <Text style={[styles.bannerPrice, { color: colors.primary }]}>₹{inquiry.productPrice.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.bannerQty, { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.06)' }]}>
            <Text style={[styles.qtyLabel, { color: colors.primary }]}>QTY: {inquiry.quantity || 1}</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={localMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isMe = item.sender === currentRole;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMe
                    ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                    : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.borderLight }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMe ? [styles.textMe, { color: colors.onPrimary }] : [styles.textOther, { color: colors.onBackground }],
                  ]}
                >
                  {item.text}
                </Text>
                <Text
                  style={[
                    styles.timeText,
                    isMe ? styles.timeMe : [styles.timeOther, { color: colors.textMuted }],
                  ]}
                >
                  {item.time}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={[styles.chatContent, { backgroundColor: colors.background }]}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.borderLight }]}>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="send" size={20} color={colors.onPrimary} />
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
