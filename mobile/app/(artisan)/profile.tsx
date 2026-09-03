import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Image, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import BottomNavigation from '../../components/BottomNavigation';
import { artisanService } from '../../services/artisanService';
import { authService } from '../../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ArtisanProfileScreen() {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [current, setCurrent] = useState(artisanService.getCurrentArtisan());
  const [shopName, setShopName] = useState(current.name);
  const [artisanName, setArtisanName] = useState(current.ownerName);
  const [location, setLocation] = useState(current.location);
  const [bio, setBio] = useState(current.bio || '');
  const [phone, setPhone] = useState(current.phone || '');
  const [avatar, setAvatar] = useState<string | undefined>(current.avatar);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((updated) => {
      setCurrent(updated);
      setShopName(updated.name);
      setArtisanName(updated.ownerName);
      setLocation(updated.location);
      setBio(updated.bio || '');
      setPhone(updated.phone || '');
      setAvatar(updated.avatar);
    });
    const fresh = artisanService.getCurrentArtisan();
    setCurrent(fresh);
    setShopName(fresh.name);
    setArtisanName(fresh.ownerName);
    setLocation(fresh.location);
    setBio(fresh.bio || '');
    setPhone(fresh.phone || '');
    setAvatar(fresh.avatar);
    return unsubscribe;
  }, []);

  const handlePickImage = () => {
    Alert.alert(
      'Profile Photo',
      'Update your artisan storefront image',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.85,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const pickedUri = result.assets[0].uri;
                setAvatar(pickedUri);
                artisanService.updateProfile({ avatar: pickedUri });
              }
            } catch (err) {
              console.error('[Profile] Camera error:', err);
              Alert.alert('Camera Error', 'Could not open camera.');
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.85,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const pickedUri = result.assets[0].uri;
                setAvatar(pickedUri);
                artisanService.updateProfile({ avatar: pickedUri });
              }
            } catch (err) {
              console.error('[Profile] Gallery error:', err);
              Alert.alert('Gallery Error', 'Could not select photo from gallery.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

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
              router.replace({ pathname: '/(auth)/login', params: { role: 'artisan' } } as any);
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
      case 'marketplace':
        router.push('/(buyer)/marketplace' as any);
        break;
      case 'add':
        router.push('/(artisan)/add-product' as any);
        break;
      case 'chat':
        router.push('/(artisan)/chat' as any);
        break;
      case 'profile':
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="Profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { borderColor: colors.card }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarLetter}>
                  {(artisanName || shopName || 'A').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </View>

          {/* Single clear photo-change action */}
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.changePhotoBtn,
              { backgroundColor: isDarkMode ? 'rgba(29,114,184,0.15)' : 'rgba(0,97,149,0.08)', borderColor: isDarkMode ? 'rgba(29,114,184,0.3)' : 'rgba(0,97,149,0.2)' },
              pressed && styles.badgePressed,
            ]}
            accessibilityLabel={avatar ? 'Change profile photo' : 'Add profile photo'}
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={15} color={colors.primary} />
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>{avatar ? 'Change Photo' : '+ Add Photo'}</Text>
          </Pressable>

          <Text style={[styles.headerName, { color: colors.onBackground }]}>{shopName || 'Your Shop'}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{artisanName || 'Artisan'}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.locationText, { color: colors.textMuted }]}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.formSection, { color: colors.textMuted }]}>Shop Details</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.onBackground }]}>Shop Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Savita Handicrafts"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.onBackground }]}>Artisan Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
              value={artisanName}
              onChangeText={setArtisanName}
              placeholder="e.g. Savita Devi"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.onBackground }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.onBackground }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Pune, Maharashtra"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.onBackground }]}>About / Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Share your heritage story..."
              placeholderTextColor={colors.textMuted}
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
        <View style={[styles.settingsSection, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.formSection, { color: colors.textMuted }]}>Account</Text>

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
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.card,
    ...Shadows.soft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarLetter: { fontSize: 38, fontWeight: '800', color: Colors.textLight },
  badgePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,97,149,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,97,149,0.2)',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.tertiary,
  },
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
