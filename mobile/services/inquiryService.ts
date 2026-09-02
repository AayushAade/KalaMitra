import { Inquiry } from '../types';
import { mockInquiries } from '../data/mockInquiries';

let inMemoryInquiries: Inquiry[] = [...mockInquiries];

export const inquiryService = {
  getInquiries: (): Inquiry[] => {
    return inMemoryInquiries;
  },

  getInquiryById: (id: string): Inquiry | undefined => {
    return inMemoryInquiries.find(i => i.id === id);
  },

  createInquiry: (inquiryData: {
    productId: string;
    productTitle: string;
    productPrice: number;
    productImage?: string;
    buyerName: string;
    buyerType?: string;
    quantity?: number;
    expectedDelivery?: string;
    message: string;
  }): Inquiry => {
    console.log(`[InquiryService] Creating new inquiry proposal:`, inquiryData);
    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      productId: inquiryData.productId,
      productTitle: inquiryData.productTitle,
      productPrice: inquiryData.productPrice,
      productImage: inquiryData.productImage,
      buyerName: inquiryData.buyerName,
      buyerType: inquiryData.buyerType,
      buyerLocation: 'Mumbai, Maharashtra',
      quantity: inquiryData.quantity,
      expectedDelivery: inquiryData.expectedDelivery,
      message: inquiryData.message,
      status: 'New',
      date: 'Today, Just Now'
    };
    inMemoryInquiries = [newInquiry, ...inMemoryInquiries];
    return newInquiry;
  },

  updateInquiryStatus: (id: string, status: 'New' | 'Replied' | 'Closed'): Inquiry | undefined => {
    console.log(`[InquiryService] Updating status of inquiry ${id} to ${status}`);
    const inquiry = inMemoryInquiries.find(i => i.id === id);
    if (inquiry) {
      inquiry.status = status;
    }
    return inquiry;
  }
};
