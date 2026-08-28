import { Artisan } from '../types';
import { mockArtisans } from '../data/mockArtisans';

let authenticatedUser: { id: string; email: string } | null = null;
let currentArtisanState: Artisan = { ...mockArtisans[0] };

type Listener = (artisan: Artisan) => void;
const listeners = new Set<Listener>();

export const artisanService = {
  /**
   * Subscribe to profile state updates reactively.
   */
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Notify all registered listeners.
   */
  notify: () => {
    listeners.forEach(listener => {
      try {
        listener(currentArtisanState);
      } catch (err) {
        console.error(`[ArtisanService] Error notifying profile subscriber:`, err);
      }
    });
  },

  /**
   * Binds the authenticated user identity to the service context.
   */
  setAuthenticatedUser: (user: { id: string; email: string } | null) => {
    authenticatedUser = user;
    if (user) {
      console.log(`[ArtisanService] Active user context loaded: ${user.email}`);
      const namePrefix = user.email.split('@')[0];
      currentArtisanState = {
        ...currentArtisanState,
        id: user.id,
        email: user.email,
        ownerName: namePrefix,
        name: `${namePrefix}'s Store`,
        // Keep demo business details
        totalProducts: 5,
        rating: 4.9,
        reviewsCount: 12
      };
    } else {
      console.log(`[ArtisanService] Cleared user context.`);
      // Reset back to initial demo profile defaults to avoid caching private user names
      currentArtisanState = {
        ...mockArtisans[0]
      };
    }
    artisanService.notify();
  },

  /**
   * Returns the current authenticated Supabase user metadata.
   */
  getAuthenticatedUser: (): { id: string; email: string } | null => {
    return authenticatedUser;
  },

  getCurrentArtisan: (): Artisan => {
    return currentArtisanState;
  },

  updateProfile: (profile: Partial<Artisan>): Artisan => {
    console.log(`[ArtisanService] Updating artisan profile:`, profile);
    currentArtisanState = {
      ...currentArtisanState,
      ...profile
    };
    artisanService.notify();
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
