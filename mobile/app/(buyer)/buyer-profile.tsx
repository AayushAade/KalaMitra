import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
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
import { Ionicons } from '@expo/vector-icons';

export default function BuyerProfileScreen() {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
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
            <Ionicons name="person-outline" size={40} color={colors.onPrimary} />
          </View>
          <Text style={[styles.headerName, { color: colors.onBackground }]}>Buyer Account</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Marketplace Browser</Text>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Preferences</Text>
          <View style={styles.settingRow}>
            <Ionicons name="language-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.settingText, { color: colors.onBackground }]}>Language</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.settingRow}>
            <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.settingText, { color: colors.onBackground }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </View>
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
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: { paddingHorizontal: Spacing.marginMobile, paddingTop: Spacing.md, paddingBottom: Spacing.xl },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerName: { fontSize: 22, fontWeight: '800', color: Colors.onBackground },
  headerSub: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },

  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: Spacing.md,
  },
  settingText: { flex: 1, fontSize: 15, color: Colors.onBackground, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  logoutBtn: { width: '100%', borderColor: '#F8B4B4', borderWidth: 1 },
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
});
