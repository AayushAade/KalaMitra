import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { artisanService } from '../../services/artisanService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArtisanProfileScreen() {
  const current = artisanService.getCurrentArtisan();

  const [shopName, setShopName] = useState(current.name);
  const [artisanName, setArtisanName] = useState(current.ownerName);
  const [location, setLocation] = useState(current.location);
  const [bio, setBio] = useState(current.bio || '');
  const [phone, setPhone] = useState(current.phone || '');

  const handleSave = () => {
    artisanService.updateProfile({
      name: shopName,
      ownerName: artisanName,
      location: location,
      bio: bio,
      phone: phone
    });

    alert('Artisan profile updated successfully!');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="Store Settings" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Shop Management</Text>
          <Text style={styles.subtitle}>Modify your public shopfront profile, contact information, and biography details.</Text>

          <View style={styles.form}>
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
              <Text style={styles.label}>Artisan Owner Name</Text>
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
              <Text style={styles.label}>Workshop Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Pune, Maharashtra"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>About the Shop / Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Share your heritage story and craft secrets with prospective buyers"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
              />
            </View>

            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              style={styles.saveBtn}
            />

            <Button
              title="View Public Storefront"
              onPress={() => router.push('/(artisan)/store' as any)}
              variant="secondary"
              style={styles.previewBtn}
            />
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: Spacing.md,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
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
    height: 100,
    paddingVertical: Spacing.sm,
    textAlignVertical: 'top',
  },
  saveBtn: {
    width: '100%',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewBtn: {
    width: '100%',
  },
});
