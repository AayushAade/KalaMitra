/**
 * The Products tab redirects to the Artisan Catalogue screen.
 * This file exists for router compatibility.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ProductsRedirect() {
  useEffect(() => {
    router.replace('/(artisan)/artisan-catalogue' as any);
  }, []);
  return null;
}
