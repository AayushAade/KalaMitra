import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function BuyerLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'default',
      }}
    >
      <Stack.Screen name="buyer-home" />
      <Stack.Screen name="marketplace" />
      <Stack.Screen name="product" />
      <Stack.Screen name="seller" />
      <Stack.Screen name="inquiry" />
      <Stack.Screen name="buyer-inbox" />
      <Stack.Screen name="buyer-profile" />
    </Stack>
  );
}
