import { Message } from '../types';
import { mockMessagesMap } from '../data/mockMessages';

let inMemoryMessagesMap: Record<string, Message[]> = {};

// Deep copy initial mockMessagesMap
Object.keys(mockMessagesMap).forEach(key => {
  inMemoryMessagesMap[key] = [...mockMessagesMap[key]];
});

export const chatService = {
  getAllMessages: (): Record<string, Message[]> => {
    return inMemoryMessagesMap;
  },

  getMessages: (inquiryId: string): Message[] => {
    return inMemoryMessagesMap[inquiryId] || [];
  },

  sendMessage: (inquiryId: string, message: Message): Message => {
    console.log(`[ChatService] Sending message in conversation ${inquiryId}:`, message);
    if (!inMemoryMessagesMap[inquiryId]) {
      inMemoryMessagesMap[inquiryId] = [];
    }
    inMemoryMessagesMap[inquiryId] = [...inMemoryMessagesMap[inquiryId], message];
    return message;
  },

  getSimulatedReply: (): Message => {
    return {
      id: `reply-${Date.now()}`,
      sender: 'Artisan',
      text: 'Dhanyawad! Understood your requirement. Let me check my materials inventory and get back to you shortly.',
      time: 'Just Now'
    };
  }
};
