import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductCatalogProvider } from '../context/ProductCatalogContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProductCatalogProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(artisan)" />
          <Stack.Screen name="(buyer)" />
        </Stack>
      </ProductCatalogProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
