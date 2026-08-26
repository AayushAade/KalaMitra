import { request } from './api';

export const inquiryService = {
  async getInquiries() {
    try {
      return await request('/inquiries', { method: 'GET' });
    } catch {
      return null;
    }
  },

  async getInquiryById(id) {
    try {
      return await request(`/inquiries/${id}`, { method: 'GET' });
    } catch {
      return null;
    }
  },

  async createInquiry(inquiryData) {
    try {
      return await request('/inquiries', {
        method: 'POST',
        body: JSON.stringify(inquiryData),
      });
    } catch {
      return {
        ...inquiryData,
        id: `inq-${Date.now()}`,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
    }
  },

  async replyInquiry(id, replyMessage) {
    try {
      return await request(`/inquiries/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyMessage }),
      });
    } catch {
      return {
        id: `msg-${Date.now()}`,
        sender: 'Artisan',
        text: replyMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  }
};

export default inquiryService;
