export interface Product {
  id: string;
  artisanId?: string;
  isPublished?: boolean;
  name: string;
  imageUrl?: string;
  originalImageUrl?: string;
  material?: string;
  price?: number;
  artisanName?: string;
  craft?: string;
  productionTime?: string;
  stock?: number;
  minOrderQuantity?: number;
  descriptionEnglish?: string;
  descriptionHindi?: string;
  voiceTranscript?: string;
  tags?: string[];
  createdAt?: string;
}
