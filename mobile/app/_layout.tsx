import React, { useEffect, useState, useMemo } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider as NavigationThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ProductCatalogProvider } from '../context/ProductCatalogContext';
import { authService } from '../services/authService';
import { artisanService } from '../services/artisanService';
import { productService } from '../services/productService';
import { supabase } from '../lib/supabase';
import { LightColors } from '../constants/theme';

// Pre-initialize native Android window background to prevent startup white flash
SystemUI.setBackgroundColorAsync(LightColors.background).catch(() => {});

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    // Listen to changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[RootLayoutNav] AuthStateChange: ${event}, User: ${session?.user?.email || 'None'}`);
      setHasUser(!!session?.user);
      setIsSessionLoaded(true);

      if (session?.user) {
        const dbRole = await authService.fetchUserRole(session.user.id);
        artisanService.setAuthenticatedUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        if (dbRole === 'artisan') {
          await artisanService.fetchProfile(session.user.id);
        }
      } else {
        artisanService.reset();
        productService.reset();
      }
    });

    // Check active session on boot
    const checkInitialSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        setHasUser(!!user);
        setIsSessionLoaded(true);
        if (user) {
          const dbRole = await authService.fetchUserRole(user.id);
          artisanService.setAuthenticatedUser({
            id: user.id,
            email: user.email || '',
          });
          if (dbRole === 'artisan') {
            await artisanService.fetchProfile(user.id);
          }
        } else {
          artisanService.reset();
          productService.reset();
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
      const activePortal = authService.getPortal();
      console.log(`[RouteGuard] Authenticated user on auth screen. Navigating to ${activePortal} portal.`);
      if (activePortal === 'buyer') {
        router.replace('/(buyer)/marketplace' as any);
      } else {
        router.replace('/(artisan)/dashboard' as any);
      }
    }
  }, [hasUser, segments, isSessionLoaded, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'default',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(artisan)" />
      <Stack.Screen name="(buyer)" />
      <Stack.Screen name="chat/[inquiryId]" />
    </Stack>
  );
}

function RootLayoutContent() {
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    // Keep native Android Activity window background strictly matched with active theme
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  const navTheme = useMemo(() => {
    const baseTheme = isDarkMode ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      dark: isDarkMode,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.onBackground,
        border: colors.borderLight,
        notification: colors.primary,
      },
    };
  }, [isDarkMode, colors]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <RootLayoutNav />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ProductCatalogProvider>
          <RootLayoutContent />
        </ProductCatalogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
