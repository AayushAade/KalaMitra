import React from 'react';
import { Stack } from 'expo-router';
import { ProductCreationProvider } from '../../context/ProductCreationContext';

export default function ArtisanLayout() {
  return (
    <ProductCreationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="add-product" />
        <Stack.Screen name="image-enhancement" />
        <Stack.Screen name="voice" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="products" />
        <Stack.Screen name="inquiries" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="store" />
      </Stack>
    </ProductCreationProvider>
  );
}
