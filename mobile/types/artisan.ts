export interface Artisan {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  craft: string;
  phone: string;
  email: string;
  language: string;
  bio: string;
  totalProducts: number;
  rating: number;
  reviewsCount: number;
  storeVerified: boolean;
  avatar?: string;
}
