import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import BottomNavigation from '../../components/BottomNavigation';
import { artisanService } from '../../services/artisanService';
import { authService } from '../../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ArtisanProfileScreen() {
  const [current, setCurrent] = useState(artisanService.getCurrentArtisan());
  const [shopName, setShopName] = useState(current.name);
  const [artisanName, setArtisanName] = useState(current.ownerName);
  const [location, setLocation] = useState(current.location);
  const [bio, setBio] = useState(current.bio || '');
  const [phone, setPhone] = useState(current.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((updated) => {
      setCurrent(updated);
      setShopName(updated.name);
      setArtisanName(updated.ownerName);
      setLocation(updated.location);
      setBio(updated.bio || '');
      setPhone(updated.phone || '');
    });
    const fresh = artisanService.getCurrentArtisan();
    setCurrent(fresh);
    setShopName(fresh.name);
    setArtisanName(fresh.ownerName);
    setLocation(fresh.location);
    setBio(fresh.bio || '');
    setPhone(fresh.phone || '');
    return unsubscribe;
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await artisanService.saveProfile({
        name: shopName.trim() || current.name,
        ownerName: artisanName.trim() || current.ownerName,
        location: location.trim() || current.location,
        bio: bio.trim(),
        phone: phone.trim()
      });
      Alert.alert('Saved', 'Profile updated successfully.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', 'Could not save profile: ' + (err.message || 'Database error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
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
        router.replace('/(artisan)/dashboard' as any);
        break;
      case 'products':
        router.push('/(artisan)/artisan-catalogue' as any);
        break;
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'inbox':
        router.push('/(artisan)/inquiries' as any);
        break;
      case 'profile':
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header showBack={true} title="Profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(artisanName || shopName || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerName}>{shopName || 'Your Shop'}</Text>
          <Text style={styles.headerSub}>{artisanName || 'Artisan'}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formSection}>Shop Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Savita Handicrafts"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Artisan Name</Text>
            <TextInput
              style={styles.input}
              value={artisanName}
              onChangeText={setArtisanName}
              placeholder="e.g. Savita Devi"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Pune, Maharashtra"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>About / Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Share your heritage story..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Button
            title={isSaving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={isSaving}
            loading={isSaving}
            variant="primary"
            style={styles.saveBtn}
          />
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.formSection}>Account</Text>

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavigation role="artisan" active="profile" onPress={handleNav} />
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
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: Colors.textLight },
  headerName: { fontSize: 22, fontWeight: '800', color: Colors.onBackground },
  headerSub: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  locationText: { fontSize: 13, color: Colors.textMuted },

  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  formSection: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  inputContainer: { marginBottom: Spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 90,
    paddingVertical: Spacing.sm,
    textAlignVertical: 'top',
  },
  saveBtn: { width: '100%', marginTop: Spacing.xs },

  settingsSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  logoutBtn: {
    width: '100%',
    borderColor: '#F8B4B4',
    borderWidth: 1,
  },
});
