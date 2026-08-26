import { Artisan } from '../types';
import { mockArtisans } from '../data/mockArtisans';

let currentArtisanState: Artisan = { ...mockArtisans[0] };

export const artisanService = {
  getCurrentArtisan: (): Artisan => {
    return currentArtisanState;
  },

  updateProfile: (profile: Partial<Artisan>): Artisan => {
    console.log(`[ArtisanService] Updating artisan profile:`, profile);
    currentArtisanState = {
      ...currentArtisanState,
      ...profile
    };
    return currentArtisanState;
  },

  getDashboardRecommendations: () => {
    return [
      { id: '1', title: '1 bulk inquiry received', desc: 'Raj Traders requested 100 Bamboo Storage Baskets.', icon: 'mail-unread-outline' },
      { id: '2', title: 'Pricing recommendation update', desc: 'Your Bamboo basket price (₹899) is highly competitive.', icon: 'pricetag-outline' },
      { id: '3', title: 'Photo enhancement suggestion', desc: 'Adding studio lighting photos increases buyer trust by 40%.', icon: 'sparkles-outline' },
    ];
  }
};
