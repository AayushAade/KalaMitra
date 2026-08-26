export interface Inquiry {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage?: string;
  buyerName: string;
  buyerType?: string;
  buyerLocation?: string;
  quantity?: number;
  expectedDelivery?: string;
  message: string;
  status: 'New' | 'Replied' | 'Closed';
  date: string;
}
