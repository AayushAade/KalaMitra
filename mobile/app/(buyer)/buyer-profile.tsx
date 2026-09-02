import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import BottomNavigation from '../../components/BottomNavigation';
import { authService } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function BuyerProfileScreen() {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header showBack={true} title="Profile" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={40} color={Colors.textLight} />
          </View>
          <Text style={styles.headerName}>Buyer Account</Text>
          <Text style={styles.headerSub}>Marketplace Browser</Text>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.settingRow}>
            <Ionicons name="language-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.settingText}>Language</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.settingText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </View>
        </View>

        <View style={styles.accountCard}>
          <Text style={styles.sectionLabel}>Account</Text>
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
});
