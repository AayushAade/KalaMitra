export interface Review {
  id: string;
  artisanId: string;
  buyerId: string;
  inquiryId: string;
  rating: number; // 1 to 5
  reviewText?: string;
  buyerName?: string;
  buyerLocation?: string;
  createdAt: string;
}
