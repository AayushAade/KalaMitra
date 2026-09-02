import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export type ArtisanTab = 'home' | 'marketplace' | 'add' | 'chat' | 'profile' | 'products' | 'inbox';
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
  isCenter?: boolean;
}

const ARTISAN_TABS: NavItem[] = [
  { key: 'home',        label: 'Home',        icon: 'home-outline',        activeIcon: 'home' },
  { key: 'marketplace', label: 'Marketplace', icon: 'storefront-outline',   activeIcon: 'storefront' },
  { key: 'add',         label: 'Add Product', icon: 'add',                 activeIcon: 'add', isCenter: true },
  { key: 'chat',        label: 'Chat',        icon: 'chatbubbles-outline',  activeIcon: 'chatbubbles' },
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
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.borderLight }]}>
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <Pressable
              key={tab.key}
              onPress={() => (props.onPress as any)(tab.key)}
              style={({ pressed }) => [
                styles.centerTabContainer,
                pressed && styles.centerTabPressed,
              ]}
              accessibilityLabel="Add Product"
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.centerAddButton,
                  {
                    backgroundColor: '#762D19',
                    borderColor: colors.card,
                  },
                ]}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.centerLabel, { color: isDarkMode ? colors.textMuted : '#762D19' }]}>
                Add
              </Text>
            </Pressable>
          );
        }

        const isActive =
          props.active === tab.key ||
          (tab.key === 'chat' && props.active === 'inbox') ||
          (tab.key === 'marketplace' && props.active === 'products');

        return (
          <Pressable
            key={tab.key}
            onPress={() => (props.onPress as any)(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.tabPressed,
            ]}
            android_ripple={{
              color: isDarkMode ? 'rgba(29,114,184,0.2)' : 'rgba(148,68,46,0.1)',
              borderless: true,
              radius: 28,
            }}
          >
            <Ionicons
              name={(isActive ? tab.activeIcon : tab.icon) as any}
              size={24}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textMuted },
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
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
    alignItems: 'center',
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
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    position: 'relative',
  },
  centerAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#762D19',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#762D19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: Colors.card,
  },
  centerTabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
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
