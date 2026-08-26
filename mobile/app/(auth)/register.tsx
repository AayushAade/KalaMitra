import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';

export default function RegisterScreen() {
  const [storeName, setStoreName] = useState('Savita Handicrafts');
  const [ownerName, setOwnerName] = useState('Savita Devi');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [craft, setCraft] = useState('Bamboo & Textile Crafts');
  const [location, setLocation] = useState('Pune, Maharashtra');
  const [selectedLanguage, setSelectedLanguage] = useState<'Hindi' | 'Marathi' | 'English'>('Hindi');

  const handleRegister = async () => {
    await authService.registerStore({
      name: storeName,
      ownerName,
      phone,
      craft,
      location,
      language: selectedLanguage
    });
    router.replace('/(artisan)/dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Register Store</Text>
            <Text style={styles.subtitle}>
              Create your digital shopfront and deploy smart AI listing helper tools.
            </Text>

            <View style={styles.form}>
              {/* Language Selection */}
              <View style={styles.langSection}>
                <Text style={styles.langLabel}>Vernacular Language:</Text>
                <View style={styles.langButtons}>
                  {(['Hindi', 'Marathi', 'English'] as const).map((lang) => (
                    <Button
                      key={lang}
                      title={lang === 'Hindi' ? 'हिंदी' : lang === 'Marathi' ? 'मराठी' : 'English'}
                      onPress={() => setSelectedLanguage(lang)}
                      variant={selectedLanguage === lang ? 'primary' : 'secondary'}
                      style={styles.langButton}
                    />
                  ))}
                </View>
              </View>

              {/* Form Inputs */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Store Name</Text>
                <TextInput
                  style={styles.input}
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="e.g. Savita Handicrafts"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Artisan Name</Text>
                <TextInput
                  style={styles.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
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
                <Text style={styles.label}>Craft Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={craft}
                  onChangeText={setCraft}
                  placeholder="e.g. Bamboo Craft"
                  placeholderTextColor={Colors.textMuted}
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

              <Button
                title="Create Account"
                onPress={handleRegister}
                variant="primary"
                style={styles.submitButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.marginMobile,
  },
  content: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    marginBottom: Spacing.xl,
  },
  langSection: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  langButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  langButton: {
    flex: 1,
    height: 38,
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
  submitButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
