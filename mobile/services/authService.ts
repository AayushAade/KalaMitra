import { supabase } from '../lib/supabase';
import { Artisan } from '../types';
import { artisanService } from './artisanService';
import { productService } from './productService';

export interface AuthResult {
  user: any;
  session: any;
  emailConfirmationRequired: boolean;
  artisan?: Artisan;
}

let activeRole: 'artisan' | 'buyer' = 'artisan';

export const authService = {
  getRole: (): 'artisan' | 'buyer' => activeRole,
  setRole: (role: 'artisan' | 'buyer') => {
    activeRole = role;
  },

  /**
   * Reads the authoritative user role from public.users table.
   */
  fetchUserRole: async (userId: string): Promise<'artisan' | 'buyer'> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data?.role && (data.role === 'buyer' || data.role === 'artisan')) {
        activeRole = data.role;
        console.log(`[AuthService] Authoritative user role loaded from database: ${activeRole}`);
        return data.role;
      }
    } catch (e) {
      console.warn('[AuthService] Could not load user role from database:', e);
    }
    return activeRole;
  },

  /**
   * Logs in a user using email and password, verifying their public.users metadata role and loading their profile.
   */
  login: async (email: string, password: string, role: 'artisan' | 'buyer'): Promise<boolean> => {
    activeRole = role;
    console.log(`[AuthService] Login attempt for: ${email} as role: ${role}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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
      console.warn('[AuthService] Metadata load failed for authenticated user:', metaError.message);
    } else if (userMeta && userMeta.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`Account role mismatch. This account is registered as a ${userMeta.role}.`);
    }

    // Initialize authenticated user context and fetch real profile from Supabase
    artisanService.setAuthenticatedUser({
      id: data.user.id,
      email: data.user.email || '',
    });

    if (role === 'artisan') {
      await artisanService.fetchProfile(data.user.id);
    }

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

    const namePrefix = email.split('@')[0] || 'Artisan';
    const cleanStoreName = storeData.name?.trim() || `${namePrefix}'s Store`;
    const cleanOwnerName = storeData.ownerName?.trim() || namePrefix;

    // Create Supabase Auth user with role and profile metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'artisan',
          shop_name: cleanStoreName,
          owner_name: cleanOwnerName,
          phone: storeData.phone || '',
          craft: storeData.craft || 'Traditional Handicrafts',
          location: storeData.location || 'India',
          language: storeData.language || 'Hindi',
        },
      },
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

    if (!emailConfirmationRequired && data.session) {
      console.log('[AuthService] Active session detected. Initializing user profile...');
      artisanService.setAuthenticatedUser({
        id: data.user.id,
        email: data.user.email || '',
      });
      await artisanService.fetchProfile(data.user.id);
    } else {
      console.log('[AuthService] Email confirmation required. Session is not active yet.');
    }

    const newArtisan: Artisan = {
      id: data.user.id,
      name: cleanStoreName,
      ownerName: cleanOwnerName,
      location: storeData.location || 'India',
      craft: storeData.craft || 'Traditional Handicrafts',
      phone: storeData.phone || '',
      email,
      language: storeData.language || 'Hindi',
      bio: storeData.bio || 'Master artisan digital storefront registered on KalaMitra.',
      totalProducts: 0,
      rating: 5.0,
      reviewsCount: 0,
      storeVerified: false,
    };

    return {
      user: data.user,
      session: data.session,
      emailConfirmationRequired,
      artisan: newArtisan,
    };
  },

  /**
   * Registers a new buyer account.
   */
  registerBuyer: async (
    buyerData: { name?: string; phone?: string },
    email: string,
    password: string
  ): Promise<AuthResult> => {
    console.log(`[AuthService] Registering new buyer identity for: ${email}`);

    const namePrefix = email.split('@')[0] || 'Buyer';
    const cleanName = buyerData.name?.trim() || namePrefix;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'buyer',
          full_name: cleanName,
          name: cleanName,
          phone: buyerData.phone?.trim() || '',
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create the buyer account.');
    }

    const emailConfirmationRequired = !data.session;

    if (!emailConfirmationRequired && data.session) {
      console.log('[AuthService] Active buyer session detected.');
      artisanService.setAuthenticatedUser({
        id: data.user.id,
        email: data.user.email || '',
      });
    }

    return {
      user: data.user,
      session: data.session,
      emailConfirmationRequired,
    };
  },

  /**
   * Sign out the active user session and purge all in-memory user caches.
   */
  logout: async (): Promise<void> => {
    console.log('[AuthService] Signing out active session and purging cache...');
    artisanService.reset();
    productService.reset();
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
      console.log('[AuthService] No active authenticated session.');
      return null;
    }
    return user;
  },
};
