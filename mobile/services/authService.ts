import { Artisan } from '../types';

export const authService = {
  login: async (identifier: string, role: 'artisan' | 'buyer'): Promise<boolean> => {
    // Simulated authentication success
    console.log(`[AuthService] Login attempt for identifier: ${identifier} as role: ${role}`);
    return true;
  },

  registerStore: async (storeData: Partial<Artisan>): Promise<Artisan> => {
    console.log(`[AuthService] Registering new artisan store:`, storeData);
    const newArtisan: Artisan = {
      id: `artisan-${Date.now()}`,
      name: storeData.name || 'Savita Handicrafts',
      ownerName: storeData.ownerName || 'Savita Devi',
      location: storeData.location || 'Pune, Maharashtra',
      craft: storeData.craft || 'Traditional Bamboo Crafts',
      phone: storeData.phone || '+91 98765 43210',
      email: storeData.email || 'savita@diynest.org',
      language: storeData.language || 'Hindi',
      bio: 'Master artisan digital storefront registered on KalaMitra.',
      totalProducts: 1,
      rating: 5.0,
      reviewsCount: 1,
      storeVerified: true
    };
    return newArtisan;
  }
};
