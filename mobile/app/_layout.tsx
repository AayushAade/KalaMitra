import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductCatalogProvider } from '../context/ProductCatalogContext';
import { authService } from '../services/authService';
import { artisanService } from '../services/artisanService';
import { supabase } from '../lib/supabase';

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    // Listen to changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[RootLayoutNav] AuthStateChange: ${event}, User: ${session?.user?.email || 'None'}`);
      setHasUser(!!session?.user);
      setIsSessionLoaded(true);

      if (session?.user) {
        artisanService.setAuthenticatedUser({
          id: session.user.id,
          email: session.user.email || ''
        });

        // Query database profile in artisan_profiles
        try {
          const { data: profile, error } = await supabase
            .from('artisan_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            console.log(`[RootLayoutNav] Synced profile details from database`);
            artisanService.updateProfile({
              name: profile.shop_name || `${session.user.email?.split('@')[0]}'s Store`,
              ownerName: profile.owner_name || session.user.email?.split('@')[0],
              location: profile.location || 'Pune, Maharashtra',
              craft: profile.craft_specialization || 'Bamboo & Textile Crafts',
              phone: profile.phone || '',
              language: profile.language || 'Hindi',
              bio: profile.bio || 'Master artisan digital storefront registered on KalaMitra.',
              storeVerified: profile.store_verified || false
            });
          }
        } catch (e) {
          console.warn(`[RootLayoutNav] Profile check failed:`, e);
        }
      } else {
        artisanService.setAuthenticatedUser(null);
      }
    });

    // Check active session on boot
    const checkInitialSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        setHasUser(!!user);
        setIsSessionLoaded(true);
        if (user) {
          artisanService.setAuthenticatedUser({
            id: user.id,
            email: user.email || ''
          });
        }
      } catch (err) {
        console.error(`[RootLayoutNav] Session restoration error:`, err);
        setHasUser(false);
        setIsSessionLoaded(true);
      }
    };
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSessionLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inArtisanGroup = segments[0] === '(artisan)';
    const inBuyerGroup = segments[0] === '(buyer)';

    if (!hasUser && (inArtisanGroup || inBuyerGroup)) {
      console.log(`[RouteGuard] Blocking access to ${segments.join('/')}. Redirecting to Login.`);
      router.replace('/(auth)/login' as any);
    } else if (hasUser && inAuthGroup) {
      console.log(`[RouteGuard] Authenticated user on auth screen. Redirecting to Dashboard.`);
      router.replace('/(artisan)/dashboard' as any);
    }
  }, [hasUser, segments, isSessionLoaded, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(artisan)" />
      <Stack.Screen name="(buyer)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProductCatalogProvider>
        <RootLayoutNav />
      </ProductCatalogProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
