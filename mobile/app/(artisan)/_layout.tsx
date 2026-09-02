import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ProductCreationProvider } from '../../context/ProductCreationContext';

export default function ArtisanLayout() {
  const { colors } = useTheme();

  return (
    <ProductCreationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'default',
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="artisan-catalogue" />
        <Stack.Screen name="artisan-review" />
        <Stack.Screen name="add-product" />
        <Stack.Screen name="image-enhancement" />
        <Stack.Screen name="voice" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="products" />
        <Stack.Screen name="inquiries" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="store" />
        <Stack.Screen name="edit-product" />
      </Stack>
    </ProductCreationProvider>
  );
}
