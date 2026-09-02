import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import BottomNavigation from '../../components/BottomNavigation';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BuyerProfileScreen() {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('Buyer Account');
  const [buyerType, setBuyerType] = useState('Marketplace Buyer');

  useEffect(() => {
    const loadBuyer = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setBuyerEmail(user.email || '');
          const prefix = user.email?.split('@')[0] || 'Buyer';

          const { data: profile } = await supabase
            .from('buyer_profiles')
            .select('company_name, business_type')
            .eq('id', user.id)
            .single();

          if (profile?.company_name) {
            setBuyerCompany(profile.company_name);
          } else {
            setBuyerCompany(`${prefix.charAt(0).toUpperCase() + prefix.slice(1)}'s Business`);
          }

          if (profile?.business_type) {
            setBuyerType(profile.business_type);
          }
        }
      } catch (err) {
        console.warn('[BuyerProfile] Non-fatal error loading profile:', err);
      }
    };
    loadBuyer();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/(auth)/login' as any);
            } catch (e: any) {
              Alert.alert('Error', 'Logout failed: ' + e.message);
            }
          },
        },
      ]
    );
  };

  const handleNav = (tab: string) => {
    switch (tab) {
      case 'home':
        router.replace('/(buyer)/buyer-home' as any);
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'inbox':
        router.push('/(buyer)/buyer-inbox' as any);
        break;
      case 'profile':
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Profile" />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="business-outline" size={38} color={colors.onPrimary} />
          </View>
          <Text style={[styles.headerName, { color: colors.onBackground }]}>{buyerCompany}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{buyerEmail || buyerType}</Text>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Preferences</Text>
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
            onPress={() => router.push('/(auth)/language' as any)}
          >
            <Ionicons name="language-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.settingText, { color: colors.onBackground }]}>Language Preferences</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
            onPress={() => Alert.alert('Buyer Protection', 'All orders placed through DIY-Nest are backed by authentic artisan verification and escrow protection.')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.settingText, { color: colors.onBackground }]}>Buyer Protection & Terms</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </Pressable>
        </View>

        <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Account</Text>

          {/* Dark Mode Switch - Immediately Above Logout */}
          <View style={[styles.darkModeRow, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.darkModeLeft}>
              <Ionicons name="moon-outline" size={20} color={colors.primary} />
              <Text style={[styles.darkModeLabel, { color: colors.onBackground }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: isDarkMode ? '#374151' : '#DBC1BA', true: colors.primary }}
              thumbColor={Platform.OS === 'android' ? (isDarkMode ? colors.onPrimary : '#FFFFFF') : undefined}
            />
          </View>

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
      <BottomNavigation role="buyer" active="profile" onPress={handleNav} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.lg,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rowPressed: {
    opacity: 0.7,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: Colors.onBackground,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  darkModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  darkModeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    width: '100%',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
});
