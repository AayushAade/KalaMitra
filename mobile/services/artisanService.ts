import { Artisan } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_EMPTY_ARTISAN: Artisan = {
  id: '',
  name: 'Artisan Store',
  ownerName: 'Artisan',
  location: 'India',
  craft: 'Traditional Handicrafts',
  phone: '',
  email: '',
  language: 'Hindi',
  bio: 'Master artisan digital storefront on KalaMitra.',
  totalProducts: 0,
  rating: 5.0,
  reviewsCount: 0,
  storeVerified: false,
};

let authenticatedUser: { id: string; email: string } | null = null;
let currentArtisanState: Artisan = { ...DEFAULT_EMPTY_ARTISAN };

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
        console.error('[ArtisanService] Error notifying profile subscriber:', err);
      }
    });
  },

  /**
   * Binds the authenticated user identity to the service context and initializes profile state.
   */
  setAuthenticatedUser: (user: { id: string; email: string } | null) => {
    authenticatedUser = user;
    if (user) {
      console.log(`[ArtisanService] Active user context loaded: ${user.email}`);
      const namePrefix = user.email.split('@')[0];
      currentArtisanState = {
        ...DEFAULT_EMPTY_ARTISAN,
        id: user.id,
        email: user.email,
        ownerName: namePrefix,
        name: `${namePrefix}'s Store`,
      };
    } else {
      console.log('[ArtisanService] Cleared user context.');
      currentArtisanState = { ...DEFAULT_EMPTY_ARTISAN };
    }
    artisanService.notify();
  },

  /**
   * Fetches the artisan profile from Supabase and synchronizes in-memory state.
   */
  fetchProfile: async (userId?: string): Promise<Artisan> => {
    const targetId = userId || authenticatedUser?.id;
    if (!targetId) {
      return currentArtisanState;
    }

    try {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) {
        console.warn(`[ArtisanService] Failed to fetch artisan profile for ${targetId}:`, error.message);
        return currentArtisanState;
      }

      // Query phone from public.users
      let userPhone = '';
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('phone')
          .eq('id', targetId)
          .single();
        if (userRow?.phone) {
          userPhone = userRow.phone;
        }
      } catch (phoneErr) {
        console.warn(`[ArtisanService] Non-fatal error loading phone from users table:`, phoneErr);
      }

      if (data) {
        const email = authenticatedUser?.email || '';
        const namePrefix = email.split('@')[0] || 'Artisan';

        currentArtisanState = {
          id: data.id,
          name: data.shop_name || `${namePrefix}'s Store`,
          ownerName: data.owner_name || namePrefix,
          location: data.location || 'India',
          craft: data.craft_specialization || 'Traditional Handicrafts',
          phone: userPhone || '',
          email: email,
          language: data.language || 'Hindi',
          bio: data.bio || 'Master artisan digital storefront on KalaMitra.',
          avatar: data.avatar_url || undefined,
          totalProducts: 0,
          rating: 5.0,
          reviewsCount: 0,
          storeVerified: data.store_verified || false,
        };

        artisanService.notify();
        return currentArtisanState;
      }
    } catch (err) {
      console.error('[ArtisanService] Exception during profile fetch:', err);
    }

    return currentArtisanState;
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

  /**
   * Updates local state and persists changes to Supabase public.artisan_profiles table
   * and public.users (for phone number).
   */
  saveProfile: async (profileUpdates: Partial<Artisan>): Promise<Artisan> => {
    console.log('[ArtisanService] Saving profile updates to Supabase:', profileUpdates);

    // 1. Update in-memory state immediately for responsive UI
    currentArtisanState = {
      ...currentArtisanState,
      ...profileUpdates,
    };
    artisanService.notify();

    // 2. Persist to Supabase if authenticated
    if (authenticatedUser?.id) {
      try {
        // Update public.artisan_profiles (strictly omitting phone)
        const profilePayload: Record<string, any> = {
          shop_name: profileUpdates.name || currentArtisanState.name,
          owner_name: profileUpdates.ownerName || currentArtisanState.ownerName,
          location: profileUpdates.location || currentArtisanState.location,
          craft_specialization: profileUpdates.craft || currentArtisanState.craft,
          bio: profileUpdates.bio !== undefined ? profileUpdates.bio : currentArtisanState.bio,
          language: profileUpdates.language || currentArtisanState.language,
        };

        if (profileUpdates.avatar !== undefined) {
          profilePayload.avatar_url = profileUpdates.avatar;
        }

        const { error: profileErr } = await supabase
          .from('artisan_profiles')
          .update(profilePayload)
          .eq('id', authenticatedUser.id);

        if (profileErr) {
          console.error('[ArtisanService] Failed to save profile to artisan_profiles:', profileErr.message);
          throw new Error(`Failed to save profile: ${profileErr.message}`);
        }

        // Update phone in public.users if provided
        if (profileUpdates.phone !== undefined) {
          const { error: userErr } = await supabase
            .from('users')
            .update({ phone: profileUpdates.phone })
            .eq('id', authenticatedUser.id);

          if (userErr) {
            console.warn('[ArtisanService] Failed to update phone on users table (non-fatal):', userErr.message);
          }
        }

        console.log('[ArtisanService] Profile persisted to Supabase successfully.');
      } catch (err: any) {
        console.error('[ArtisanService] Exception saving profile:', err);
        throw err;
      }
    }

    return currentArtisanState;
  },

  updateProfile: (profile: Partial<Artisan>): Artisan => {
    currentArtisanState = {
      ...currentArtisanState,
      ...profile,
    };
    artisanService.notify();
    return currentArtisanState;
  },

  reset: () => {
    authenticatedUser = null;
    currentArtisanState = { ...DEFAULT_EMPTY_ARTISAN };
    artisanService.notify();
  },

  getDashboardRecommendations: () => {
    return [
      { id: '1', title: '1 bulk inquiry received', desc: 'A wholesale buyer requested product details.', icon: 'mail-unread-outline' },
      { id: '2', title: 'Pricing recommendation update', desc: 'Market analysis shows high festive demand for handcrafted items.', icon: 'pricetag-outline' },
      { id: '3', title: 'Photo enhancement suggestion', desc: 'Adding studio lighting photos increases buyer trust by 40%.', icon: 'sparkles-outline' },
    ];
  },
};
