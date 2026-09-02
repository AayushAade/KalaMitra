import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

export type ArtisanTab = 'home' | 'products' | 'marketplace' | 'inbox' | 'profile';
export type BuyerTab = 'home' | 'marketplace' | 'inbox' | 'profile';

interface ArtisanNavProps {
  role: 'artisan';
  active: ArtisanTab;
  onPress: (tab: ArtisanTab) => void;
}

interface BuyerNavProps {
  role: 'buyer';
  active: BuyerTab;
  onPress: (tab: BuyerTab) => void;
}

type BottomNavigationProps = ArtisanNavProps | BuyerNavProps;

interface NavItem {
  key: string;
  label: string;
  icon: string;
  activeIcon: string;
}

const ARTISAN_TABS: NavItem[] = [
  { key: 'home',        label: 'Home',        icon: 'home-outline',        activeIcon: 'home' },
  { key: 'products',    label: 'Products',    icon: 'grid-outline',         activeIcon: 'grid' },
  { key: 'marketplace', label: 'Marketplace', icon: 'storefront-outline',   activeIcon: 'storefront' },
  { key: 'inbox',       label: 'Inbox',       icon: 'chatbubbles-outline',  activeIcon: 'chatbubbles' },
  { key: 'profile',     label: 'Profile',     icon: 'person-outline',       activeIcon: 'person' },
];

const BUYER_TABS: NavItem[] = [
  { key: 'home',        label: 'Home',        icon: 'home-outline',        activeIcon: 'home' },
  { key: 'marketplace', label: 'Marketplace', icon: 'storefront-outline',   activeIcon: 'storefront' },
  { key: 'inbox',       label: 'Inbox',       icon: 'chatbubbles-outline',  activeIcon: 'chatbubbles' },
  { key: 'profile',     label: 'Profile',     icon: 'person-outline',       activeIcon: 'person' },
];

export default function BottomNavigation(props: BottomNavigationProps) {
  const tabs = props.role === 'artisan' ? ARTISAN_TABS : BUYER_TABS;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = props.active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => (props.onPress as any)(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.tabPressed,
            ]}
            android_ripple={{ color: 'rgba(148,68,46,0.1)', borderless: true, radius: 28 }}
          >
            <Ionicons
              name={(isActive ? tab.activeIcon : tab.icon) as any}
              size={24}
              color={isActive ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingBottom: 4,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
