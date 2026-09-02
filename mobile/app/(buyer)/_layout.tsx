import React from 'react';
import { Stack } from 'expo-router';

export default function BuyerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="marketplace" />
      <Stack.Screen name="product" />
      <Stack.Screen name="seller" />
      <Stack.Screen name="inquiry" />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
