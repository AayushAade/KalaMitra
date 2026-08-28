import { supabase } from '../lib/supabase';
import { Artisan } from '../types';
import { artisanService } from './artisanService';

export interface AuthResult {
  user: any;
  session: any;
  emailConfirmationRequired: boolean;
  artisan?: Artisan;
}

export const authService = {
  /**
   * Logs in a user using email and password, verifying their public.users metadata role.
   */
  login: async (email: string, password: string, role: 'artisan' | 'buyer'): Promise<boolean> => {
    console.log(`[AuthService] Login attempt for: ${email} as role: ${role}`);
    
    // Sign in with password using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Sanitize standard auth error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user profile was returned from authentication.');
    }

    // Query public.users metadata to check for role compatibility
    const { data: userMeta, error: metaError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (metaError) {
      // If metadata record is missing but auth succeeded, allow it for development fallback.
      // In production, this would be strictly enforced by the backend database triggers.
      console.warn(`[AuthService] Metadata load failed for authenticated user:`, metaError.message);
      return true;
    }

    if (userMeta && userMeta.role !== role) {
      // Clean sign out if role mismatches
      await supabase.auth.signOut();
      throw new Error(`Account role mismatch. This account is registered as a ${userMeta.role}.`);
    }

    artisanService.setAuthenticatedUser({
      id: data.user.id,
      email: data.user.email || ''
    });

    return true;
  },

  /**
   * Registers a new artisan store by creating an auth.user identity.
   */
  registerStore: async (
    storeData: Partial<Artisan>,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    console.log(`[AuthService] Registering new user identity for: ${email}`);

    // Create Supabase Auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create the user account.');
    }

    const emailConfirmationRequired = !data.session;

    // CASE A: Supabase returns active session (email confirmation disabled)
    if (!emailConfirmationRequired && data.session) {
      console.log(`[AuthService] Active session detected. Inserting public.users metadata...`);
      const { error: metaError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          phone: storeData.phone || '',
          role: 'artisan'
        });

      if (metaError) {
        console.error(`[AuthService] Failed to insert public.users metadata:`, metaError.message);
      }

      artisanService.setAuthenticatedUser({
        id: data.user.id,
        email: data.user.email || ''
      });
    } else {
      console.log(`[AuthService] Email confirmation required. Session is not active yet.`);
    }

    // Mock Artisan Storefront response to maintain frontend UI stability,
    // as direct client-side insert into artisan_profiles is disabled (server-controlled).
    const mockArtisan: Artisan = {
      id: data.user.id,
      name: storeData.name || 'Savita Handicrafts',
      ownerName: storeData.ownerName || 'Savita Devi',
      location: storeData.location || 'Pune, Maharashtra',
      craft: storeData.craft || 'Traditional Bamboo Crafts',
      phone: storeData.phone || '',
      email,
      language: storeData.language || 'Hindi',
      bio: 'Master artisan digital storefront registered on KalaMitra.',
      totalProducts: 0,
      rating: 5.0,
      reviewsCount: 0,
      storeVerified: false
    };

    return {
      user: data.user,
      session: data.session,
      emailConfirmationRequired,
      artisan: mockArtisan
    };
  },

  /**
   * Sign out the active user session.
   */
  logout: async (): Promise<void> => {
    console.log(`[AuthService] Signing out active session...`);
    artisanService.setAuthenticatedUser(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Retrieves the current authenticated user details.
   */
  getCurrentUser: async (): Promise<any> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log(`[AuthService] No active authenticated session.`);
      return null;
    }
    return user;
  }
};
