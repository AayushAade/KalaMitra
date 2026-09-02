import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { mockMessagesMap } from '../data/mockMessages';

let inMemoryMessagesMap: Record<string, Message[]> = {};

// Deep copy initial mockMessagesMap as fallback
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

  /**
   * Fetches real messages for an inquiry conversation from Supabase.
   */
  fetchMessages: async (inquiryId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, inquiry_id, sender_id, sender_role, text, created_at')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn(`[ChatService] Failed to fetch messages for inquiry ${inquiryId}:`, error.message);
        return inMemoryMessagesMap[inquiryId] || [];
      }

      if (data && data.length > 0) {
        const mapped: Message[] = data.map((row: any) => ({
          id: row.id,
          sender: row.sender_role,
          text: row.text,
          time: new Date(row.created_at).toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
        }));

        inMemoryMessagesMap[inquiryId] = mapped;
        return mapped;
      }
    } catch (err) {
      console.error('[ChatService] Exception fetching messages:', err);
    }

    return inMemoryMessagesMap[inquiryId] || [];
  },

  /**
   * Sends a message to Supabase public.messages table.
   */
  sendMessage: async (
    inquiryId: string,
    message: Message
  ): Promise<Message> => {
    console.log(`[ChatService] Sending message in conversation ${inquiryId}:`, message);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        const { data: inserted, error } = await supabase
          .from('messages')
          .insert({
            inquiry_id: inquiryId,
            sender_id: userId,
            sender_role: message.sender,
            text: message.text.trim()
          })
          .select()
          .single();

        if (error) {
          console.warn('[ChatService] Supabase message insert failed (falling back to memory):', error.message);
        } else if (inserted) {
          const persistedMsg: Message = {
            id: inserted.id,
            sender: inserted.sender_role,
            text: inserted.text,
            time: new Date(inserted.created_at).toLocaleTimeString('en-IN', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          };

          if (!inMemoryMessagesMap[inquiryId]) {
            inMemoryMessagesMap[inquiryId] = [];
          }
          inMemoryMessagesMap[inquiryId] = [...inMemoryMessagesMap[inquiryId], persistedMsg];
          return persistedMsg;
        }
      }
    } catch (err) {
      console.error('[ChatService] Exception sending message:', err);
    }

    // Local fallback
    if (!inMemoryMessagesMap[inquiryId]) {
      inMemoryMessagesMap[inquiryId] = [];
    }
    inMemoryMessagesMap[inquiryId] = [...inMemoryMessagesMap[inquiryId], message];
    return message;
  }
};
