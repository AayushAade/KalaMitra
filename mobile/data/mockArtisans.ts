import { Artisan } from '../types';

export const mockArtisans: Artisan[] = [
  {
    id: "artisan-101",
    name: "Savita Handicrafts",
    ownerName: "Savita Devi",
    location: "Pune, Maharashtra",
    craft: "Traditional Bamboo & Textile Crafts",
    phone: "+91 98765 43210",
    email: "savita@diynest.org",
    language: "Hindi",
    bio: "Master artisan with 18+ years of experience in traditional handloom weaving and eco-friendly bamboo handicraft creations.",
    totalProducts: 5,
    rating: 4.9,
    reviewsCount: 38,
    storeVerified: true,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCy1USh0c8IntFY5avkMXenmevurHwDA1Q4m7vKQnQg7-tsxS3lFEnAJi4vD1f6cxGcUG5FZJ2ns-D3sr92PAMybljwnAn2MxCu5Uaf6YT8S6ka8PxLfy6h-pIAEq24YCUlPrxz2XSsCBMD6s8DL_QogfRv7DwZfiDJkNn0gwsSD3686yq6LYYpopHjuBhLR0kUqwIJXXi5kMSxFKxCs8iAiOolYSlSrjlEiWniaWjilD3i6IJp6Zl3"
  }
];

export const currentArtisan = mockArtisans[0];
