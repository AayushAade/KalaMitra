import { supabase } from '../lib/supabase';
import { Artisan } from '../types';
import { artisanService } from './artisanService';
import { productService } from './productService';
import { isEmail, normalizePhoneNumber, isValidPhoneNumber } from '../utils/phone';

export interface AuthResult {
  user: any;
  session: any;
  emailConfirmationRequired: boolean;
  artisan?: Artisan;
}

// UI Experience Portal currently active ('artisan' | 'buyer')
let activePortal: 'artisan' | 'buyer' = 'artisan';

// Authoritative account role loaded from public.users database table
let databaseRole: 'artisan' | 'buyer' | null = null;

export const authService = {
  /**
   * Returns the current UI portal experience ('artisan' | 'buyer').
   */
  getPortal: (): 'artisan' | 'buyer' => activePortal,

  /**
   * Sets the current UI portal experience.
   */
  setPortal: (portal: 'artisan' | 'buyer') => {
    activePortal = portal;
  },

  /**
   * Backward-compatible alias for getPortal.
   */
  getRole: (): 'artisan' | 'buyer' => activePortal,

  /**
   * Backward-compatible alias for setPortal.
   */
  setRole: (role: 'artisan' | 'buyer') => {
    activePortal = role;
  },

  /**
   * Returns the database role verified from public.users table.
   */
  getDatabaseRole: (): 'artisan' | 'buyer' | null => databaseRole,

  /**
   * Reads the authoritative user role from public.users table without overwriting active portal.
   */
  fetchUserRole: async (userId: string): Promise<'artisan' | 'buyer'> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data?.role && (data.role === 'buyer' || data.role === 'artisan')) {
        databaseRole = data.role;
        console.log(`[AuthService] Authoritative user role in database: ${databaseRole}`);
        return data.role;
      }
    } catch (e) {
      console.warn('[AuthService] Could not load user role from database:', e);
    }
    return databaseRole || 'artisan';
  },

  /**
   * Logs in a user using Email OR Phone number + Password.
   * Dispatches to the chosen portal without redirect loops.
   */
  login: async (
    identifier: string,
    password: string,
    portal: 'artisan' | 'buyer'
  ): Promise<boolean> => {
    activePortal = portal;
    const cleanId = identifier.trim();
    console.log(`[AuthService] Login attempt for identifier: "${cleanId}" to portal: "${portal}"`);

    let credentials: { email?: string; phone?: string; password: string };

    if (isEmail(cleanId)) {
      credentials = { email: cleanId, password };
    } else {
      const normalized = normalizePhoneNumber(cleanId);
      if (!isValidPhoneNumber(normalized)) {
        throw new Error('Please enter a valid email address or phone number (e.g. +91 98765 43210).');
      }
      credentials = { phone: normalized, password };
    }

    const { data, error } = await supabase.auth.signInWithPassword(credentials as any);

    if (error) {
      if (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_grant')
      ) {
        throw new Error('Invalid email/phone or password. Please try again.');
      }
      if (
        error.message.includes('phone_provider_disabled') ||
        error.message.includes('Phone logins are disabled')
      ) {
        throw new Error(
          'Phone login is not enabled in your Supabase project. Please log in with your email or enable the Phone provider in the Supabase Dashboard.'
        );
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user profile was returned from authentication.');
    }

    // Query public.users database role
    const authoritativeRole = await authService.fetchUserRole(data.user.id);

    // If an account is strictly registered as a buyer and tries to enter the artisan seller dashboard
    if (portal === 'artisan' && authoritativeRole === 'buyer') {
      await supabase.auth.signOut();
      databaseRole = null;
      throw new Error('This account is registered as a Buyer. Please sign in via the Buyer portal.');
    }

    // Set authenticated user context
    artisanService.setAuthenticatedUser({
      id: data.user.id,
      email: data.user.email || '',
    });

    // If the user has artisan profile data, load it into context
    if (authoritativeRole === 'artisan') {
      await artisanService.fetchProfile(data.user.id);
    }

    console.log(
      `[AuthService] Login successful! Portal="${activePortal}", DatabaseRole="${authoritativeRole}"`
    );
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
      rating: null,
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
    databaseRole = null;
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
